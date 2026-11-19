import app from '../netlify/functions/app.js';
import http from 'http';

const server = http.createServer(app);
const PORT = 5055;

async function runTests() {
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Test server running on port ${PORT}...`);

  const baseUrl = `http://localhost:${PORT}/api`;

  try {
    // 1. Health check
    console.log('\n--- 1. Testing GET /api/health ---');
    const healthRes = await fetch(`${baseUrl}/health`).then(r => r.json());
    console.log('Health Response:', healthRes);
    if (healthRes.status !== 'ok') throw new Error('Health check failed');

    // 2. Site Config
    console.log('\n--- 2. Testing GET /api/site-config ---');
    const configRes = await fetch(`${baseUrl}/site-config`).then(r => r.json());
    console.log('Site Name:', configRes.data?.siteSettings?.siteName);
    console.log('Hero Title:', configRes.data?.hero?.title);
    if (!configRes.data?.hero?.title) throw new Error('Site config failed');

    // 3. Categories
    console.log('\n--- 3. Testing GET /api/categories ---');
    const catRes = await fetch(`${baseUrl}/categories`).then(r => r.json());
    console.log(`Loaded ${catRes.data?.length} categories`);
    if (!catRes.data || catRes.data.length === 0) throw new Error('Categories failed');

    // 4. Products
    console.log('\n--- 4. Testing GET /api/products ---');
    const prodRes = await fetch(`${baseUrl}/products`).then(r => r.json());
    console.log(`Loaded ${prodRes.data?.length} products`);
    if (!prodRes.data || prodRes.data.length === 0) throw new Error('Products failed');

    // 5. Product Detail by Slug
    console.log('\n--- 5. Testing GET /api/products/:slug ---');
    const testSlug = prodRes.data[0].slug;
    const singleProdRes = await fetch(`${baseUrl}/products/${testSlug}`).then(r => r.json());
    console.log('Fetched single product:', singleProdRes.data?.name);
    if (singleProdRes.data?.slug !== testSlug) throw new Error('Single product failed');

    // 6. Order Placement (COD)
    console.log('\n--- 6. Testing POST /api/orders (Public Checkout) ---');
    const orderPayload = {
      customer: {
        fullName: 'Shakib Al Hasan',
        phoneNumber: '01712345678',
        district: 'Dhaka',
        deliveryArea: 'inside_dhaka',
        address: 'House 12, Road 4, Banani, Dhaka'
      },
      items: [
        {
          productId: prodRes.data[0]._id || prodRes.data[0].slug,
          slug: prodRes.data[0].slug,
          quantity: 2
        }
      ],
      attribution: {
        fbclid: 'test_fbclid_12345',
        utmSource: 'facebook',
        utmCampaign: 'winter_minoxidil_sale'
      }
    };

    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    }).then(r => r.json());

    console.log('Order created successfully:', orderRes.orderId);
    console.log('Subtotal:', orderRes.data?.subtotal);
    console.log('Delivery Charge:', orderRes.data?.deliveryCharge);
    console.log('Final Total:', orderRes.data?.finalTotal);
    if (!orderRes.orderId) throw new Error('Order creation failed');

    // 7. Order Confirmation Retrieval
    console.log('\n--- 7. Testing GET /api/orders/:orderId ---');
    const trackingRes = await fetch(`${baseUrl}/orders/${orderRes.orderId}`).then(r => r.json());
    console.log('Order status:', trackingRes.data?.orderStatus);
    console.log('Customer name in order:', trackingRes.data?.customer?.fullName);
    if (trackingRes.data?.orderId !== orderRes.orderId) throw new Error('Order lookup failed');

    // 8. Admin Login
    console.log('\n--- 8. Testing POST /api/admin/login ---');
    const loginRes = await fetch(`${baseUrl}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@HairCare2026' })
    }).then(r => r.json());

    console.log('Admin login response:', loginRes.success ? 'SUCCESS' : 'FAILED');
    if (!loginRes.token) throw new Error('Admin login failed');

    const adminToken = loginRes.token;

    // 9. Admin Dashboard
    console.log('\n--- 9. Testing GET /api/admin/dashboard ---');
    const dashRes = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());
    console.log('Total Orders in Dash:', dashRes.data?.stats?.totalOrders);
    console.log('Total Revenue in Dash:', dashRes.data?.stats?.totalRevenue);
    if (dashRes.data?.stats?.totalOrders < 1) throw new Error('Dashboard stats missing order');

    // 10. Admin Update Order Status
    console.log('\n--- 10. Testing PUT /api/admin/orders/:id/status ---');
    const statusUpdateRes = await fetch(`${baseUrl}/admin/orders/${orderRes.orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'Confirmed',
        note: 'Customer confirmed via phone call',
        internalNotes: 'Steadfast Courier Booking #987654'
      })
    }).then(r => r.json());
    console.log('New Order Status:', statusUpdateRes.data?.orderStatus);
    console.log('Status History entries:', statusUpdateRes.data?.statusHistory?.length);
    if (statusUpdateRes.data?.orderStatus !== 'Confirmed') throw new Error('Status update failed');

    // 11. Admin Update Site Config (CMS Live Edit)
    console.log('\n--- 11. Testing PUT /api/admin/site-config (CMS Editor) ---');
    const cmsUpdateRes = await fetch(`${baseUrl}/admin/site-config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        hero: {
          ...configRes.data.hero,
          title: 'Your Hair Care Journey Starts Here (Updated)'
        }
      })
    }).then(r => r.json());
    console.log('Updated Hero Title:', cmsUpdateRes.data?.hero?.title);
    if (cmsUpdateRes.data?.hero?.title !== 'Your Hair Care Journey Starts Here (Updated)') {
      throw new Error('CMS update failed');
    }

    console.log('\n========================================');
    console.log('✅ ALL 11 END-TO-END TESTS PASSED CLEANLY!');
    console.log('========================================\n');

  } catch (err) {
    console.error('\n❌ Test failure:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();

