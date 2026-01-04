describe('BookJourney End-to-End Tests', () => {

  // 🛠️ HELPER: The "Bulletproof" Register & Login Flow
  // This helper satisfies the need to test Authentication flows repeatedly [cite: 33, 46]
  const registerAndLogin = (user, pass) => {
    // --- PHASE 1: NAVIGATE TO REGISTER ---
    cy.contains('a', 'Create').click(); 

    // 🛑 GUARD 1: Wait for the Login Page to vanish
    // Forces Cypress to wait until the "Sign In" button is GONE 
    // before looking for registration fields.
    cy.contains('button', 'Sign In').should('not.exist');

    // 🛑 GUARD 2: Confirm we are on the Register URL
    cy.url().should('include', '/register');

    // --- PHASE 2: REGISTER ---
    cy.get('input[placeholder="Username"]').should('be.visible').type(user);
    cy.get('input[placeholder="Password"]').type(pass);
    cy.get('button[type="submit"]').click();

    // --- PHASE 3: HANDLE REDIRECT ---
    // Wait for success alert
    cy.on('window:alert', (text) => expect(text).to.contain('created'));
    
    // 🛑 GUARD 3: Wait for the Register Page to vanish
    // Ensure we are back at the Login screen before typing again
    cy.url().should('eq', 'http://localhost:5173/');
    cy.contains('button', 'Register').should('not.exist');
    cy.contains('button', 'Sign In').should('be.visible');

    // --- PHASE 4: LOGIN ---
    // Clear inputs first to ensure no stale data
    cy.get('input[placeholder="Username"]').should('be.visible').clear().type(user);
    cy.get('input[placeholder="Password"]').clear().type(pass);
    cy.contains('button', 'Sign In').click();

    // --- PHASE 5: VERIFY COLLECTION ---
    cy.url().should('include', '/collection');
    cy.contains('My Library').should('be.visible');
  };

  beforeEach(() => {
    // Reset state before every test [cite: 20]
    cy.visit('http://localhost:5173');
    cy.window().then((win) => win.localStorage.clear());
  });

  // 🧪 TC-01: Full Onboarding Verification (Auth Module)
  // Covers: Register Endpoint & Login Endpoint [cite: 33]
  it('TC-01: Should navigate to register, create account, and login successfully', () => {
    const user = `user_${Date.now()}`;
    const pass = 'password123';
    
    registerAndLogin(user, pass);

    // Verify the main header exists (Proof of Dashboard access) [cite: 33]
    cy.contains('h1', 'BookJourney').should('be.visible');
  });

  // 🧪 TC-02: Search and Add Book Flow (Search Module)
  // Covers: Search Endpoint & Add Book Endpoint [cite: 46]
  it('TC-02: Should search for a book and add it to the library', () => {
    const user = `searcher_${Date.now()}`;
    const pass = 'password123';
    
    registerAndLogin(user, pass);

    // 1. Perform Search
    // Finds input by placeholder text matching "Search"
    cy.get('input[placeholder*="Search"]').type('Harry Potter');
    cy.contains('button', 'Search').click();

    // 2. Add Book
    // Wait for results pane to appear
    cy.get('.results-pane').should('be.visible');
    // Click "Add" on the first card found
    cy.get('.card').first().find('button').contains('Add').click();

    // 3. Verify it moved to "My Library"
    cy.contains('My Library').scrollIntoView();
    // Check if a saved-card contains the title (partial match)
    cy.get('.saved-card').should('contain', 'Potter');
  });

  // 🧪 TC-03: Manage Book (Collection Module)
  // Covers: Update Book Endpoint (PATCH) [cite: 46]
  it('TC-03: Should update book rating and status', () => {
    const user = `manager_${Date.now()}`;
    const pass = 'password123';
    
    registerAndLogin(user, pass);

    // 1. Add a book first so we have something to edit
    cy.get('input[placeholder*="Search"]').type('Dune');
    cy.contains('button', 'Search').click();
    cy.get('.results-pane').should('be.visible');
    cy.get('.card').first().find('button').contains('Add').click();

    // 2. Open Menu (Click the book card in My Library)
    cy.get('.saved-card').first().click();
    cy.get('.modal-content').should('be.visible');

    // 3. Update Details
    // Change Status to "Reading"
    cy.get('select').select('Reading');
    // Update Rating (Click 5th star)
    cy.get('.star-rating-input span').last().click(); 
    // Save changes
    cy.get('.btn-save').click();

    // 4. Verify Updates on Main Card
    cy.get('.saved-card').first().within(() => {
      // The status badge should now say "Reading"
      cy.contains('Reading').should('be.visible');
      // There should be 5 active stars visible
      cy.get('.active-star').should('have.length', 5);
    });
  });

});