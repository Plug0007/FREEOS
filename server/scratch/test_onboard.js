const mockDb = require('../mockDb');
const Client = mockDb.Client;

async function testOnboard() {
    console.log('--- STARTING DIAGNOSTIC ONBOARD ---');
    try {
        const testData = {
            userId: 'seed-user-1',
            name: 'Diagnostic Test Client',
            email: 'test@diagnostic.com',
            project: 'Logic Verification',
            paymentTerms: '50/50',
            budget: 50000,
            chatHistory: [{ sender: 'System', content: 'Diagnostic Start', date: new Date().toISOString() }]
        };

        console.log('1. Constructing Client object...');
        const client = new Client(testData);
        
        console.log('2. Attempting .save() call...');
        await client.save();
        
        console.log('3. Success! Client persisted to memory.');
        console.log('Generated ID:', client._id);
        
        console.log('4. Verification: Fetching all clients...');
        const all = await Client.find({});
        console.log('Current Client Count:', all.length);
        
        if (all.length > 0) {
            console.log('✅ DIAGNOSTIC PASSED: MockDB is functional.');
        } else {
            console.log('❌ DIAGNOSTIC FAILED: Storage is empty.');
        }
    } catch (err) {
        console.error('❌ DIAGNOSTIC CRASH:', err.message);
        console.error(err.stack);
    }
}

testOnboard();
