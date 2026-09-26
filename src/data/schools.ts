import type { School } from '../types'

// Demonstration records use public institutional contact patterns. Replace this module
// with an official district/NCES import before using the tool for operational outreach.
export const schools: School[] = [
  { id: 'lincoln', name: 'Lincoln Elementary School', type: 'Elementary', lat: 32.7876, lng: -96.7970, address: '500 N Oak Street', city: 'Dallas', state: 'TX', zip: '75201', email: 'office@lincolnelementary.edu', website: 'lincolnelementary.edu' },
  { id: 'washington', name: 'Washington Middle School', type: 'Middle', lat: 32.7942, lng: -96.8038, address: '2200 Cedar Avenue', city: 'Dallas', state: 'TX', zip: '75201', email: 'contact@washingtonmiddle.edu', website: 'washingtonmiddle.edu' },
  { id: 'northside', name: 'Northside High School', type: 'High School', lat: 32.7805, lng: -96.8104, address: '1800 Commerce Street', city: 'Dallas', state: 'TX', zip: '75201', email: 'info@northsidehigh.edu', website: 'northsidehigh.edu' },
  { id: 'sage-state', name: 'SAGE State University', type: 'College / University', lat: 32.7767, lng: -96.7969, address: '1 University Plaza', city: 'Dallas', state: 'TX', zip: '75201', email: 'admissions@sagestate.edu', website: 'sagestate.edu' },
  { id: 'oak-ridge', name: 'Oak Ridge Elementary', type: 'Elementary', lat: 32.8100, lng: -96.7900, address: '710 Maple Road', city: 'Dallas', state: 'TX', zip: '75204', email: 'office@oakridgeelementary.edu', website: 'oakridgeelementary.edu' },
  { id: 'central', name: 'Central Technical College', type: 'College / University', lat: 32.7650, lng: -96.8150, address: '900 Foundry Lane', city: 'Dallas', state: 'TX', zip: '75215', email: 'hello@centraltech.edu', website: 'centraltech.edu' },
]
