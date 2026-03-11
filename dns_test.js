import dns from 'dns';
dns.resolve4('db.lydfzgzvxrayytzjgbmz.supabase.co', (err, addresses) => {
  console.log('IPv4 Addresses:', addresses || 'None found');
  if (err) console.log('IPv4 Error:', err.message);
});
dns.resolve6('db.lydfzgzvxrayytzjgbmz.supabase.co', (err, addresses) => {
  console.log('IPv6 Addresses:', addresses || 'None found');
  if (err) console.log('IPv6 Error:', err.message);
});
