/**
 * Smart Intelligence Service (WhatsApp / JSON)
 * Extracts Client Name, Email, Budget, and Full History.
 */
const parseChat = (text) => {
  const result = {
    name: '',
    email: '',
    budget: 0,
    project: '',
    history: []
  };

  if (!text) return result;

  // 🔹 Intelligent JSON Detection & Mapping
  try {
    const jsonData = JSON.parse(text);
    const parseItem = (item) => {
        // Alias mapping for flexible JSON support
        const name = item.name || item.client || item.clientName || item.customer || item.fullName || '';
        const email = item.email || item.emailAddress || item.contact || '';
        const budget = parseFloat(item.budget || item.amount || item.total || item.price || item.cost || 0);
        const project = item.project || item.title || item.subject || item.description || '';
        const history = item.chatHistory || item.history || item.messages || [];
        
        return { name, email, budget, project, history: Array.isArray(history) ? history.map(m => ({
            date: m.date || new Date().toISOString(),
            sender: m.sender || m.name || 'Unknown',
            content: m.message || m.content || m.text || ''
        })) : [] };
    };

    if (Array.isArray(jsonData)) {
        // If it's an array, it might be a list of clients OR a list of messages
        // Check first item to determine
        if (jsonData.length > 0 && (jsonData[0].message || jsonData[0].content)) {
            result.history = jsonData.map(m => ({
                date: m.date || new Date().toISOString(),
                sender: m.sender || m.name || 'Unknown',
                content: m.message || m.content || m.text || ''
            }));
            return result;
        } else {
            // It's a list of clients, take the first one for the detail view
            return parseItem(jsonData[0]);
        }
    } else if (typeof jsonData === 'object') {
        return parseItem(jsonData);
    }
  } catch (e) { /* Not JSON, continue to .txt parsing */ }

  const lines = text.split('\n');
  
  // 🔹 WhatsApp Regex Pattern: [Date, Time] Name: Message
  // Examples: 
  // [17/04/24, 10:24:55] Aadil: Hey
  // 17/04/24, 10:24 - Aadil: Hey
  const linePattern = /(?:\[?(\d{1,4}[-/.\s,]\d{1,2}[-/.\s,]\d{1,4})[,]?\s+(\d{1,2}:\d{2}(?::\d{2})?\s?(?:AM|PM)?)\]?|(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}))\s?[:\-]?\s?([^:]+):\s(.*)/i;

  // 🔹 Intelligence Extractors
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i;
  const projectKeywords = ['project', 'logo', 'website', 'app', 'design', 'development', 'branding'];

  lines.forEach(line => {
    // 1. Extract Details if not found yet
    if (!result.email) {
      const eMatch = line.match(emailRegex);
      if (eMatch) result.email = eMatch[1].toLowerCase();
    }

    if (!result.budget) {
      // Improved regex to catch typos like 'buget' and suffixes
      const budgetRegex = /(?:budget|buget|total|price|amount|quote|cost|₹|\$)\s?(?:is|of|fixed|for)?\s?[:\-]?\s?(?:₹|\$)?\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s?(k|l|lac|lakh)?/i;
      const bMatch = line.match(budgetRegex);
      if (bMatch) {
         let amount = parseFloat(bMatch[1].replace(/,/g, ''));
         const suffix = bMatch[2] ? bMatch[2].toLowerCase() : '';
         if (suffix === 'k') amount *= 1000;
         if (suffix === 'l' || suffix === 'lac' || suffix === 'lakh') amount *= 100000;
         result.budget = amount;
      }
    }

    // 🔹 Advanced Name Extraction (e.g. "My name is Zaid")
    const nameIntroPattern = /(?:my name is|i am|this is)\s?([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i;
    const nMatch = line.match(nameIntroPattern);
    if (nMatch && !result.name) {
        result.name = nMatch[1].trim();
    }

    if (!result.project) {
        // Look for "I want the [Project]" or keywords
        const projectPattern = /(?:want the|need a|for the|project is)\s?([^,\.\n]{3,30})/i;
        const pMatch = line.match(projectPattern);
        if (pMatch) {
            result.project = pMatch[1].trim();
        } else if (projectKeywords.some(kw => line.toLowerCase().includes(kw))) {
            result.project = line.replace(/\[.*?\]/g, '').replace(/.*?:/g, '').trim().substring(0, 100);
        }
    }

    // 2. Parse Timeline
    const match = line.match(linePattern);
    if (match) {
        const date = match[1] || match[3];
        const sender = match[5].trim();
        const content = match[6].trim();
        
        if (!result.name && sender.toLowerCase() !== 'me' && !sender.toLowerCase().includes('you')) {
            result.name = sender;
        }

        result.history.push({ date, sender, content });
    }
  });

  return result;
};

module.exports = { parseChat };
