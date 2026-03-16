
import fetch from 'node-fetch';

async function testCheckout() {
  try {
    const res = await fetch('http://localhost:5173/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposal_id: 0,
        buyer_id: 'test-buyer',
        seller_id: 'test-seller',
        item_id: 1,
        title: 'Oggetto Test',
        price: 99.99,
        category: 'Test',
        image_url: 'https://example.com/image.jpg',
        shipping_details: {
          name: 'Mario',
          surname: 'Rossi',
          email: 'mario.rossi@example.com',
          phone: '+39 123 456789',
          address: 'Via Roma 1',
          city: 'Milano',
          cap: '20121'
        }
      })
    });
    const data = await res.json();
    console.log('Result:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

testCheckout();
