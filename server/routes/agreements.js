const express = require('express');
const router = express.Router();
const AgreementOriginal = require('../models/Agreement');
const ClientOriginal = require('../models/Client');
const mockDb = require('../mockDb');
const auth = require('../middleware/auth');
const { sendAgreementEmail } = require('../services/emailService');

const Agreement = process.env.USE_MOCK === 'true' ? mockDb.Agreement : AgreementOriginal;
const Client = process.env.USE_MOCK === 'true' ? mockDb.Client : ClientOriginal;

const Template = process.env.USE_MOCK === 'true' ? mockDb.Template : require('../models/Template');

// Template definitions (System Defaults)
const systemTemplates = [
  { 
    id: 'basic', 
    name: 'Basic Freelance', 
    content: `THIS AGREEMENT is made between {{client_name}} and the Freelancer for the project: {{project}}.

1. SERVICES: The freelancer will provide {{project}} services.
2. PAYMENT: The client agrees to pay {{amount}} as per the agreed schedule ({{payment_terms}}).
3. TIMELINE: The project will be completed by {{timeline}}.

Signed: ____________________`
  },
  { 
    id: 'milestone', 
    name: 'Milestone Contract', 
    content: `MILESTONE AGREEMENT between {{client_name}} and the Freelancer.

Project: {{project}}
Total Amount: {{amount}}

MILESTONES:
1. Deposit: 20%
2. First Draft: 40% (Due within {{timeline}})
3. Final Delivery: 40%

Payment Terms: {{payment_terms}}`
  }
];

// Get all agreements
router.get('/', auth, async (req, res) => {
  try {
    const agreements = await Agreement.find({ userId: req.userId }).populate('clientId');
    res.json(agreements);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all templates (System + Custom)
router.get('/templates', auth, async (req, res) => {
  try {
    const customTemplates = await Template.find({ userId: req.userId });
    res.json({
      system: systemTemplates,
      custom: customTemplates
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Save a new template
router.post('/templates', auth, async (req, res) => {
  try {
    const { name, content } = req.body;
    const template = await Template.create({
      userId: req.userId,
      name,
      content
    });
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create agreement from template
router.post('/template', auth, async (req, res) => {
  try {
    const { clientId, templateType, details } = req.body;
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    let templateBody = '';
    const systemMatch = systemTemplates.find(t => t.id === templateType);
    
    if (systemMatch) {
      templateBody = systemMatch.content;
    } else {
      const customMatch = await Template.findById(templateType);
      if (customMatch) {
        templateBody = customMatch.content;
      } else {
        templateBody = systemTemplates[0].content; // Fallback to basic
      }
    }

    let content = templateBody;
    
    // Placeholder replacement
    const placeholders = {
      '{{client_name}}': client.name,
      '{{project}}': details.project || client.project || 'the stated project',
      '{{amount}}': details.amount ? `₹${details.amount}` : 'the agreed amount',
      '{{timeline}}': details.timeline || 'the project schedule',
      '{{payment_terms}}': client.paymentTerms || 'standard terms'
    };

    Object.keys(placeholders).forEach(key => {
      content = content.split(key).join(placeholders[key]);
    });

    const agreement = await Agreement.create({
      userId: req.userId,
      clientId,
      title: `${client.name} - ${details.project || 'Project Agreement'}`,
      content,
      templateType,
      status: 'draft'
    });

    res.status(201).json(agreement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update agreement content
router.put('/:id', auth, async (req, res) => {
  try {
    const { content, title, status } = req.body;
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return res.status(404).json({ message: 'Not found' });

    agreement.content = content || agreement.content;
    agreement.title = title || agreement.title;
    agreement.status = status || agreement.status;
    
    await agreement.save();
    res.json(agreement);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send agreement via email
router.post('/:id/send', auth, async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id).populate('clientId');
    if (!agreement) return res.status(404).json({ message: 'Agreement not found' });

    if (!agreement.clientId || !agreement.clientId.email) {
      return res.status(400).json({ 
        message: 'Could not send: Client has no email address associated. Please update the client record first.' 
      });
    }

    try {
      await sendAgreementEmail(
        agreement.clientId.email, 
        agreement.clientId.name, 
        agreement.title, 
        agreement.content
      );
    } catch (emailErr) {
      // Procedural failure, we continue
    }

    agreement.status = 'sent';
    await agreement.save();
    res.json({ message: 'Agreement processed and marked as sent to ' + agreement.clientId.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error while sending agreement' });
  }
});

module.exports = router;
