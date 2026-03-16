
import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:5173/api/transactions/1/ship', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tracking_id: 'TEST123',
        courier: 'DHL',
        seller_iban: 'IT1234567890'
      })
    });
    const data = await res.json();
    console.log('Result:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
