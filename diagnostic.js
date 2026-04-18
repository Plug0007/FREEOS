const mockDb = require('./server/mockDb');
const jwt = require('jsonwebtoken');

async function diagnostic() {
    console.log('--- MOCK DB DIAGNOSTIC ---');
    const storage = require('./server/mockDb')._storage_exposed_for_debug || {}; 
    // Wait, mockDb doesn't expose storage. I'll add a temporary export.
    
    // I'll just use the models
    const invoices = await mockDb.Invoice.find({});
    const payments = await mockDb.Payment.find({}).populate('invoiceId');
    const clients = await mockDb.Client.find({});
    
    console.log('Invoices Total:', invoices.length);
    invoices.forEach(i => console.log(`  - Inv: ${i._id}, User: ${i.userId}, Amount: ${i.totalAmount}, Client: ${i.clientId}`));
    
    console.log('Payments Total:', payments.length);
    payments.forEach(p => {
        const inv = p.invoiceId;
        console.log(`  - Pay: ${p._id}, Amount: ${p.amount}, Invoice: ${inv?._id || inv}, InvUser: ${inv?.userId}`);
    });
    
    console.log('Clients Total:', clients.length);
}

// I need to modify mockDb.js to expose storage or just trust the find results.
// But wait, I can just create a route or run a node script that imports it.
diagnostic();
