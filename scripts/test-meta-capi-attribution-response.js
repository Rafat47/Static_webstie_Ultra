import assert from 'assert';
import http from 'http';
import mongoose from 'mongoose';
import MetaEventLog from '../netlify/functions/models/MetaEventLog.js';
import { sendMetaCapiEvent, retryMetaCapiEvent } from '../netlify/functions/utils/metaCapi.js';

// Setup Mock HTTP Server to simulate Meta Graph API responses
let mockMetaServer;
let mockResponseStatusCode = 200;
let mockResponseStatusText = 'OK';
let mockResponseBody = JSON.stringify({ events_received: 1, fbtrace_id: 'mock_trace_123' });
let mockResponseHeaders = { 'Content-Type': 'application/json' };
let lastReceivedHeaders = null;
let lastReceivedBody = null;
let serverPort = 9876;

async function startMockServer() {
  return new Promise((resolve) => {
    mockMetaServer = http.createServer((req, res) => {
      lastReceivedHeaders = req.headers;
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        lastReceivedBody = body ? JSON.parse(body) : null;
        res.writeHead(mockResponseStatusCode, mockResponseStatusText, mockResponseHeaders);
        res.end(mockResponseBody);
      });
    });
    mockMetaServer.listen(serverPort, () => {
      resolve();
    });
  });
}

async function stopMockServer() {
  return new Promise((resolve) => {
    if (mockMetaServer) {
      mockMetaServer.close(() => resolve());
    } else {
      resolve();
    }
  });
}

async function runTests() {
  console.log('--- STARTING META CAPI ATTRIBUTION & COMPLETE RESPONSE TESTS ---');
  await startMockServer();

  // Point Graph API URL in tests to mock server by overriding global fetch or testing unit functions
  const originalFetch = global.fetch;

  // Global fetch mock delegating to our mock server
  global.fetch = async (url, options) => {
    const mockUrl = `http://localhost:${serverPort}/events`;
    return originalFetch(mockUrl, options);
  };

  // Mock Mongo in-memory or mock save
  const createdLogs = [];
  const origCreate = MetaEventLog.create;
  const origFindById = MetaEventLog.findById;

  MetaEventLog.create = async (doc) => {
    const mockDoc = {
      _id: 'mock_log_' + Math.random().toString(36).substr(2, 9),
      ...doc,
      save: async function() { return this; }
    };
    createdLogs.push(mockDoc);
    return mockDoc;
  };

  MetaEventLog.findById = async (id) => {
    return createdLogs.find(l => l._id === id) || null;
  };

  try {
    // =========================================================================
    // TEST 1: ATTRIBUTION REMOVAL - ONLY ATTRIBUTION IN CUSTOM_DATA
    // =========================================================================
    console.log('\n[Test 1] Custom Data with ONLY attribution -> custom_data omitted completely');
    mockResponseStatusCode = 200;
    mockResponseBody = JSON.stringify({ events_received: 1, fbtrace_id: 'trace_test_1' });

    const originalCustomData1 = {
      attribution: {
        landingPage: 'https://example.com/product/minoxidil',
        referrer: 'https://facebook.com/',
        timestamp: 1795157020589
      }
    };
    // Shallow copy to verify non-destruction
    const copyOfOriginal1 = JSON.parse(JSON.stringify(originalCustomData1));

    const res1 = await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_meta_token_secret',
      eventName: 'PageView',
      eventId: 'pageview_test_001',
      customData: originalCustomData1
    });

    assert.strictEqual(res1.success, true);
    // 1. Verify outgoing payload received by Meta mock server
    const transmittedEvent1 = lastReceivedBody.data[0];
    assert.strictEqual(
      transmittedEvent1.custom_data,
      undefined,
      'custom_data MUST be completely omitted when attribution is the only property!'
    );
    // 2. Verify original customData was not mutated
    assert.deepStrictEqual(originalCustomData1, copyOfOriginal1, 'original customData object must not be mutated!');
    // 3. Verify logged payload in DB also omitted custom_data
    const log1 = createdLogs[createdLogs.length - 1];
    assert.strictEqual(
      log1.request.payload.data[0].custom_data,
      undefined,
      'Logged payload must also omit custom_data when empty'
    );
    console.log('✓ Test 1 Passed: custom_data omitted when only attribution is present, original data untouched.');

    // =========================================================================
    // TEST 2: ATTRIBUTION REMOVAL - LEGITIMATE PARAMETERS PRESERVED
    // =========================================================================
    console.log('\n[Test 2] Custom Data with attribution AND valid params -> attribution removed, params preserved');
    const originalCustomData2 = {
      attribution: {
        landingPage: 'https://example.com/',
        referrer: '',
        timestamp: 1795157020589
      },
      currency: 'BDT',
      value: 1250,
      content_name: 'Kirkland Minoxidil 5%',
      content_type: 'product',
      contents: [{ id: 'kirkland-minox', quantity: 1, item_price: 1250 }]
    };
    const copyOfOriginal2 = JSON.parse(JSON.stringify(originalCustomData2));

    const res2 = await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_meta_token_secret',
      eventName: 'AddToCart',
      eventId: 'add_to_cart_test_002',
      customData: originalCustomData2
    });

    assert.strictEqual(res2.success, true);
    const transmittedEvent2 = lastReceivedBody.data[0];
    assert.ok(transmittedEvent2.custom_data, 'custom_data should be present');
    assert.strictEqual(transmittedEvent2.custom_data.attribution, undefined, 'custom_data.attribution must be deleted');
    assert.strictEqual(transmittedEvent2.custom_data.currency, 'BDT');
    assert.strictEqual(transmittedEvent2.custom_data.value, 1250);
    assert.strictEqual(transmittedEvent2.custom_data.content_name, 'Kirkland Minoxidil 5%');
    assert.strictEqual(transmittedEvent2.custom_data.content_type, 'product');
    assert.strictEqual(transmittedEvent2.custom_data.contents.length, 1);
    // Verify original object untouched
    assert.deepStrictEqual(originalCustomData2, copyOfOriginal2);
    console.log('✓ Test 2 Passed: attribution stripped, valid product/order params 100% preserved.');

    // =========================================================================
    // TEST 3: COMPLETE RESPONSE CAPTURE - SUCCESS HTTP 200 WITH WARNINGS
    // =========================================================================
    console.log('\n[Test 3] Meta Success Response (HTTP 200 with messages and custom fields)');
    const metaSuccessResponse = {
      events_received: 1,
      messages: ['Warning: Phone format could be improved'],
      fbtrace_id: 'trace_success_777',
      custom_future_meta_field: { future_code: 42, flag: true }
    };
    mockResponseStatusCode = 200;
    mockResponseStatusText = 'OK';
    mockResponseBody = JSON.stringify(metaSuccessResponse);

    const res3 = await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_meta_token_secret',
      eventName: 'Purchase',
      eventId: 'purchase_test_003',
      orderId: 'ORD-9901'
    });

    assert.strictEqual(res3.success, true);
    assert.strictEqual(res3.status, 'partial_success'); // because messages length > 0
    const log3 = createdLogs[createdLogs.length - 1];
    assert.strictEqual(log3.response.httpStatus, 200);
    assert.strictEqual(log3.response.httpStatusText, 'OK');
    assert.strictEqual(log3.response.responseParseStatus, 'success');
    assert.strictEqual(log3.response.fbtraceId, 'trace_success_777');
    assert.strictEqual(log3.response.rawBody, JSON.stringify(metaSuccessResponse));
    assert.deepStrictEqual(log3.response.metaResponseBody, metaSuccessResponse);
    assert.strictEqual(log3.response.metaResponseBody.custom_future_meta_field.future_code, 42);
    console.log('✓ Test 3 Passed: Complete HTTP 200 response stored including rawBody, parsed metaResponseBody, and future fields.');

    // =========================================================================
    // TEST 4: COMPLETE RESPONSE CAPTURE - HTTP 400 ERROR RESPONSE
    // =========================================================================
    console.log('\n[Test 4] Meta Error Response (HTTP 400 with subcodes, user messages, trace ID)');
    const metaErrorResponse = {
      error: {
        message: 'Invalid parameter',
        type: 'OAuthException',
        code: 100,
        error_subcode: 2804001,
        is_transient: false,
        error_user_title: 'Malformed Event Data',
        error_user_msg: 'A parameter in custom_data is invalid',
        error_data: { details: 'Field attribution is not recognized' },
        fbtrace_id: 'error_trace_400_xyz'
      }
    };
    mockResponseStatusCode = 400;
    mockResponseStatusText = 'Bad Request';
    mockResponseBody = JSON.stringify(metaErrorResponse);

    const res4 = await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_meta_token_secret',
      eventName: 'ViewContent',
      eventId: 'view_content_test_004'
    });

    assert.strictEqual(res4.success, false);
    assert.strictEqual(res4.status, 'invalid_payload');
    assert.strictEqual(res4.httpStatus, 400);

    const log4 = createdLogs[createdLogs.length - 1];
    assert.strictEqual(log4.response.httpStatus, 400);
    assert.strictEqual(log4.response.httpStatusText, 'Bad Request');
    assert.strictEqual(log4.response.errorCode, 100);
    assert.strictEqual(log4.response.errorMessage, 'Invalid parameter');
    assert.strictEqual(log4.response.fbtraceId, 'error_trace_400_xyz');
    assert.notStrictEqual(log4.response.rawBody, null, 'rawBody must NEVER be null on HTTP 400!');
    assert.strictEqual(log4.response.rawBody, JSON.stringify(metaErrorResponse));
    assert.deepStrictEqual(log4.response.metaResponseBody, metaErrorResponse);
    assert.strictEqual(log4.response.metaResponseBody.error.error_subcode, 2804001);
    assert.strictEqual(log4.response.metaResponseBody.error.error_user_title, 'Malformed Event Data');
    assert.strictEqual(log4.response.metaResponseBody.error.error_data.details, 'Field attribution is not recognized');
    assert.strictEqual(log4.response.responseParseStatus, 'success');
    console.log('✓ Test 4 Passed: HTTP 400 response body fully preserved with all subcodes, user messages, and trace ID.');

    // =========================================================================
    // TEST 5: EMPTY RESPONSE BODY (HTTP 204 or NO CONTENT)
    // =========================================================================
    console.log('\n[Test 5] Empty Response Body Handling');
    mockResponseStatusCode = 204;
    mockResponseStatusText = 'No Content';
    mockResponseBody = '';

    const res5 = await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_meta_token_secret',
      eventName: 'PageView',
      eventId: 'empty_test_005'
    });

    const log5 = createdLogs[createdLogs.length - 1];
    assert.strictEqual(log5.response.httpStatus, 204);
    assert.strictEqual(log5.response.responseParseStatus, 'empty');
    assert.strictEqual(log5.response.rawBody, '');
    assert.strictEqual(log5.response.metaResponseBody, null);
    console.log('✓ Test 5 Passed: Empty body handled gracefully without crashing.');

    // =========================================================================
    // TEST 6: NON-JSON HTML PROXY ERROR (HTTP 502 Bad Gateway)
    // =========================================================================
    console.log('\n[Test 6] Non-JSON HTML Error Handling');
    mockResponseStatusCode = 502;
    mockResponseStatusText = 'Bad Gateway';
    mockResponseBody = '<html><body>502 Bad Gateway from Cloudflare Proxy</body></html>';

    const res6 = await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_meta_token_secret',
      eventName: 'PageView',
      eventId: 'html_test_006'
    });

    const log6 = createdLogs[createdLogs.length - 1];
    assert.strictEqual(log6.response.httpStatus, 502);
    assert.strictEqual(log6.response.responseParseStatus, 'failed');
    assert.ok(log6.response.parseError, 'parseError should be set');
    assert.strictEqual(log6.response.rawBody, '<html><body>502 Bad Gateway from Cloudflare Proxy</body></html>');
    assert.strictEqual(log6.response.metaResponseBody, null);
    console.log('✓ Test 6 Passed: HTML error preserved in rawBody with failed parse status and error message.');

    // =========================================================================
    // TEST 7: TOKEN SECURITY
    // =========================================================================
    console.log('\n[Test 7] Access Token Security Check');
    const secretToken = 'EAABtestSecretToken123456';
    await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: secretToken,
      eventName: 'PageView',
      eventId: 'security_test_007'
    });
    // Check Authorization header was received by mock server
    assert.strictEqual(lastReceivedHeaders['authorization'], `Bearer ${secretToken}`);
    // Check token was NEVER written to log
    const log7 = createdLogs[createdLogs.length - 1];
    const logStr = JSON.stringify(log7);
    assert.strictEqual(
      logStr.includes(secretToken),
      false,
      'Access token MUST NOT be stored in MetaEventLog!'
    );
    console.log('✓ Test 7 Passed: Access token transmitted via Bearer Authorization header, never stored in DB.');

    // =========================================================================
    // TEST 8: RETRY LOGIC SANITIZATION AND COMPLETE RESPONSE
    // =========================================================================
    console.log('\n[Test 8] Retry Meta CAPI Event Sanitization');
    // Simulate an older log record that had nested attribution in its stored payload
    const oldFailedLog = {
      _id: 'old_log_with_attribution_999',
      eventId: 'retry_test_008',
      eventName: 'AddToCart',
      status: 'failed',
      request: {
        payload: {
          data: [
            {
              event_name: 'AddToCart',
              event_time: 1795176876,
              event_id: 'retry_test_008',
              custom_data: {
                attribution: { landingPage: 'https://example.com' },
                currency: 'BDT',
                value: 999
              }
            }
          ]
        }
      },
      save: async function() { return this; }
    };
    createdLogs.push(oldFailedLog);

    mockResponseStatusCode = 200;
    mockResponseBody = JSON.stringify({ events_received: 1, fbtrace_id: 'trace_retry_888' });

    const retryRes = await retryMetaCapiEvent(oldFailedLog._id);
    assert.strictEqual(retryRes.success, true);
    // Verify that the retry stripped attribution
    const retriedEventData = lastReceivedBody.data[0];
    assert.strictEqual(retriedEventData.custom_data.attribution, undefined);
    assert.strictEqual(retriedEventData.custom_data.currency, 'BDT');
    assert.strictEqual(retriedEventData.custom_data.value, 999);
    assert.strictEqual(oldFailedLog.response.fbtraceId, 'trace_retry_888');
    assert.deepStrictEqual(oldFailedLog.response.metaResponseBody, { events_received: 1, fbtrace_id: 'trace_retry_888' });
    console.log('✓ Test 8 Passed: Retry sanitized nested attribution and stored full response body.');

    console.log('\n========================================');
    console.log('ALL 8 META CAPI FIX TESTS PASSED 100%!');
    console.log('========================================\n');

  } finally {
    global.fetch = originalFetch;
    MetaEventLog.create = origCreate;
    MetaEventLog.findById = origFindById;
    await stopMockServer();
  }
}

runTests().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
