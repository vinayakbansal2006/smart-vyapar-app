import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTest() {
  console.log('--- Starting Connections Test ---');

  // We need 3 users in user_profiles to test with: a Manufacturer, Distributor, and Retailer.
  // We'll see if there are any existing ones we can use.
  
  const { data: users, error: fetchError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(50);
    
  if (fetchError) {
    console.error('Error fetching users:', JSON.stringify(fetchError, null, 2));
    return;
  }
  
  const manufacturer = users.find(u => u.role === 'MANUFACTURER');
  const distributor = users.find(u => u.role === 'DISTRIBUTOR');
  const retailer = users.find(u => u.role === 'RETAILER');
  
  if (!manufacturer || !distributor || !retailer) {
    console.log('Could not find all 3 roles in existing user_profiles. Roles found:');
    console.log('Manufacturer:', !!manufacturer);
    console.log('Distributor:', !!distributor);
    console.log('Retailer:', !!retailer);
    console.log('\nPlease create these profiles either in the App UI first or adjust the database manually, since creating Auth users via Anon key is restricted.');
    return;
  }
  
  console.log('Found 3 users to test with:');
  console.log(`Manufacturer: ${manufacturer.name} (${manufacturer.id})`);
  console.log(`Distributor:  ${distributor.name} (${distributor.id})`);
  console.log(`Retailer:     ${retailer.name} (${retailer.id})`);
  
  // Test connection: Manufacturer -> Distributor
  console.log('\n[1] Manufacturer follows Distributor');
  const { data: conn1, error: err1 } = await supabase
    .from('connections')
    .insert({
      sender_id: manufacturer.id,
      receiver_id: distributor.id,
      sender_role: manufacturer.role,
      receiver_role: distributor.role,
      status: 'PENDING'
    })
    .select()
    .single();
    
  if (err1) console.log('Error or connection already exists:', err1.message);
  else console.log('Success! Connection ID:', conn1.id);
  
  // Test connection: Distributor -> Retailer
  console.log('\n[2] Distributor follows Retailer');
  const { data: conn2, error: err2 } = await supabase
    .from('connections')
    .insert({
      sender_id: distributor.id,
      receiver_id: retailer.id,
      sender_role: distributor.role,
      receiver_role: retailer.role,
      status: 'PENDING'
    })
    .select()
    .single();
    
  if (err2) console.log('Error or connection already exists:', err2.message);
  else console.log('Success! Connection ID:', conn2.id);

  // Check the network of Distributor
  console.log('\n[3] Fetching connections for Distributor');
  const { data: distConns, error: err3 } = await supabase
    .from('connections')
    .select('*')
    .or(`sender_id.eq.${distributor.id},receiver_id.eq.${distributor.id}`);
    
  if (err3) console.log('Error fetching connections:', err3.message);
  else {
    console.log(`Found ${distConns.length} connections for Distributor:`);
    distConns.forEach(c => {
      let linkedRole = c.sender_id === distributor.id ? c.receiver_role : c.sender_role;
      let linkedId = c.sender_id === distributor.id ? c.receiver_id : c.sender_id;
      console.log(` - Connected with ${linkedRole} (ID: ${linkedId}) [Status: ${c.status}]`);
    });
  }

  console.log('\n--- Connections Test Complete ---');
}

runTest();
