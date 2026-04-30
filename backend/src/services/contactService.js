import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTACTS_PATH = join(__dirname, '../../data/contacts.json');

/**
 * Load contacts from JSON file
 */
function loadContacts() {
  try {
    if (!existsSync(CONTACTS_PATH)) return [];
    const data = JSON.parse(readFileSync(CONTACTS_PATH, 'utf-8'));
    return data.contacts || [];
  } catch (err) {
    console.error('❌ Failed to load contacts:', err.message);
    return [];
  }
}

/**
 * Save contacts to JSON file
 */
function saveContacts(contacts) {
  try {
    const data = {
      contacts,
      _instructions: "Phone numbers with country code, e.g. 919876543210 (91 = India). Add your contacts here!"
    };
    writeFileSync(CONTACTS_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`📇 Contacts saved (${contacts.length} contacts)`);
  } catch (err) {
    console.error('❌ Failed to save contacts:', err.message);
  }
}

/**
 * Find a contact by name (fuzzy match)
 * @param {string} name - Contact name to search for
 * @returns {{ name: string, phone: string, aliases: string[] } | null}
 */
export function findContact(name) {
  const contacts = loadContacts();
  const searchName = name.toLowerCase().trim();

  for (const contact of contacts) {
    // Exact name match
    if (contact.name.toLowerCase() === searchName) return contact;
    
    // Alias match
    if (contact.aliases && contact.aliases.some(a => a.toLowerCase() === searchName)) return contact;

    // Partial match (e.g. "amit" matches "Amit Bhai")
    if (contact.name.toLowerCase().includes(searchName)) return contact;
    if (contact.aliases && contact.aliases.some(a => a.toLowerCase().includes(searchName))) return contact;
  }

  return null;
}

/**
 * Add or update a contact
 * @param {string} name
 * @param {string} phone
 * @param {string[]} aliases
 */
export function addContact(name, phone, aliases = []) {
  const contacts = loadContacts();
  
  const existing = contacts.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
  
  if (existing !== -1) {
    contacts[existing].phone = phone;
    if (aliases.length > 0) {
      contacts[existing].aliases = [...new Set([...contacts[existing].aliases, ...aliases])];
    }
  } else {
    contacts.push({
      name,
      phone,
      aliases: aliases.length > 0 ? aliases : [name.toLowerCase()],
    });
  }

  saveContacts(contacts);
  return true;
}

/**
 * List all contacts
 */
export function listContacts() {
  return loadContacts();
}

/**
 * Generate WhatsApp deep link
 * @param {string} phone - Phone number with country code
 * @param {string} message - Pre-filled message
 * @returns {string} WhatsApp URL
 */
export function getWhatsAppLink(phone, message = '') {
  // Clean phone number — remove spaces, dashes, plus sign
  const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
  
  const encodedMsg = encodeURIComponent(message);
  
  // Use wa.me for universal compatibility (works on desktop + mobile)
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}
