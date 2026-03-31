const { test, expect } = require('@playwright/test');
const { performLogin } = require('../../utils/auth/login-action');
const { ContactNamePage } = require('../../pages/contact-module');
<<<<<<< ours
=======
const { writeCreatedContactName } = require('../../utils/shared-run-state');
const { registerNotesTasksSuite } = require('../helpers/register-notes-tasks-suite');
>>>>>>> theirs

const uniqueSuffix = String(Date.now()).slice(-4);
const alphabeticSuffix = uniqueSuffix
  .split('')
  .map((digit) => String.fromCharCode(65 + Number(digit)))
  .join('');

const VALID_CONTACT = {
  email: `contact.${uniqueSuffix}@signal-qa.com`,
  firstName: `Auto${alphabeticSuffix.slice(0, 2)}`,
  lastName: `Contact${alphabeticSuffix.slice(2)}`,
  jobTitle: 'QA Engineer',
  phone: '1234567890',
  cellPhone: '1234567891'
};

const SEARCH_TERMS = {
  nonExistent: `NoContact${uniqueSuffix}`
};

test.describe.serial('Contact Module', () => {
  let context;
  let page;
  let contactPage;
  let createdContactFullName = '';

<<<<<<< ours
=======
  async function ensureCreatedContactExists() {
    if (createdContactFullName) {
      return createdContactFullName;
    }

    await contactPage.navigateDirectly();
    await contactPage.createContact(VALID_CONTACT);
    createdContactFullName = `${VALID_CONTACT.firstName} ${VALID_CONTACT.lastName}`;
    process.env.CREATED_CONTACT_NAME = createdContactFullName;
    writeCreatedContactName(createdContactFullName);
    await contactPage.navigateDirectly();
    return createdContactFullName;
  }

  async function openCreatedContactDetail() {
    const contactName = await ensureCreatedContactExists();
    await contactPage.navigateDirectly();
    await contactPage.searchContact(contactName);
    await contactPage.openContactByName(contactName);

    await expect(page).toHaveURL(/\/contacts\/detail\//);
    await expect(page.getByRole('heading', { name: contactName, level: 3 })).toBeVisible();
  }

>>>>>>> theirs
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000);
    context = await browser.newContext();
    page = await context.newPage();
    contactPage = new ContactNamePage(page);

    await performLogin(page);
  });

  test.beforeEach(async () => {
    await contactPage.closeOpenDrawerIfPresent();
    await contactPage.navigateDirectly();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('TC-CN-001 | Contacts page loads after login', async () => {
    test.setTimeout(180_000);
    await expect(page).toHaveURL(/\/app\/sales\/contacts/);
    await expect(page.getByText('Contacts').first()).toBeVisible();
  });

  test('TC-CN-002 | Contacts table has correct columns', async () => {
    await contactPage.assertContactsTableVisible();

    const expectedColumns = ['Contact Name', 'Email', 'Phone', 'Job Title', 'Created Date'];
    for (const column of expectedColumns) {
      await expect(page.getByRole('columnheader', { name: column })).toBeVisible();
    }
  });

  test('TC-CN-003 | Create Contact Form opens', async () => {
    await contactPage.openCreateDrawer();

    await expect(contactPage.createDrawerHeading).toBeVisible();
    await expect(contactPage.emailField).toBeVisible();
    await expect(contactPage.firstNameField).toBeDisabled();
    await expect(contactPage.lastNameField).toBeDisabled();
  });

  test('TC-CN-004 | Create button disabled when Email is empty', async () => {
    await contactPage.openCreateDrawer();
    await contactPage.assertCreateSubmitDisabled();
  });

  test('TC-CN-005 | Create Contact with valid data succeeds', async () => {
    await contactPage.openCreateDrawer();
    await contactPage.fillCreateForm(VALID_CONTACT);

    await expect(contactPage.firstNameField).toBeEnabled();
    await expect(contactPage.lastNameField).toBeEnabled();
    await expect(contactPage.createSubmitBtn).toBeEnabled();

    await contactPage.submitCreateForm();
    createdContactFullName = `${VALID_CONTACT.firstName} ${VALID_CONTACT.lastName}`;
    await expect(contactPage.createDrawerHeading).not.toBeVisible();
  });

  test('TC-CN-006 | Cancel Create Contact closes drawer', async () => {
    await contactPage.openCreateDrawer();
    await contactPage.emailField.fill(`cancel.${uniqueSuffix}@signal-qa.com`);
    await contactPage.cancelCreateForm();
    await expect(contactPage.createDrawerHeading).not.toBeVisible();
  });

  test('TC-CN-007 | Search by name returns matching contacts', async () => {
    expect(createdContactFullName).toBeTruthy();

    await contactPage.searchContact(createdContactFullName);
    await expect(page.getByRole('cell', { name: new RegExp(createdContactFullName, 'i') }).first()).toBeVisible();
  });

  test('TC-CN-008 | Search with non-existent term shows no results', async () => {
    await contactPage.searchContact(SEARCH_TERMS.nonExistent);
    await expect(contactPage.searchBox).toHaveValue(SEARCH_TERMS.nonExistent);
    await expect(page.getByRole('cell', { name: new RegExp(SEARCH_TERMS.nonExistent, 'i') }).first()).not.toBeVisible();
  });

  test('TC-CN-009 | Click contact name navigates to detail page', async () => {
    expect(createdContactFullName).toBeTruthy();
    await contactPage.searchContact(createdContactFullName);
    await contactPage.openContactByName(createdContactFullName);

    await expect(page).toHaveURL(/\/contacts\/detail\//);
    await expect(page.getByRole('heading', { name: createdContactFullName, level: 3 })).toBeVisible();
    await expect(contactPage.overviewHeading).toBeVisible();
  });

  test('TC-CN-010 | Detail page renders Activities, Notes, Tasks tabs', async () => {
    expect(createdContactFullName).toBeTruthy();
    await contactPage.searchContact(createdContactFullName);
    await contactPage.openContactByName(createdContactFullName);

    await expect(contactPage.activitiesTab).toBeVisible();
    await expect(contactPage.notesTab).toBeVisible();
    await expect(contactPage.tasksTab).toBeVisible();
  });

  test('TC-CN-011 | Detail sidebar has About, Company, Property sections', async () => {
    expect(createdContactFullName).toBeTruthy();
    await contactPage.searchContact(createdContactFullName);
    await contactPage.openContactByName(createdContactFullName);

    await expect(contactPage.aboutThisContactBtn).toBeVisible();
    await expect(contactPage.companySectionBtn).toBeVisible();
    await expect(contactPage.propertySectionBtn).toBeVisible();
  });

  test('TC-CN-012 | Edit Contact drawer opens with correct state', async () => {
<<<<<<< ours
    expect(createdContactFullName).toBeTruthy();
=======
    await ensureCreatedContactExists();
>>>>>>> theirs
    await contactPage.searchContact(createdContactFullName);
    await contactPage.openContactByName(createdContactFullName);
    await contactPage.openEditDrawer();

    await expect(contactPage.editDrawerHeading).toBeVisible();
    await expect(contactPage.emailField).toBeDisabled();
    await expect(contactPage.firstNameField).toBeEnabled();
    await expect(contactPage.lastNameField).toBeEnabled();
  });

  test('TC-CN-013 | Save Contact disabled with no changes', async () => {
<<<<<<< ours
    expect(createdContactFullName).toBeTruthy();
=======
    await ensureCreatedContactExists();
>>>>>>> theirs
    await contactPage.searchContact(createdContactFullName);
    await contactPage.openContactByName(createdContactFullName);
    await contactPage.openEditDrawer();
    await contactPage.assertSaveContactDisabled();
  });

  test('TC-CN-014 | Edit Contact updates Job Title successfully', async () => {
<<<<<<< ours
    expect(createdContactFullName).toBeTruthy();
=======
    await ensureCreatedContactExists();
>>>>>>> theirs
    await contactPage.searchContact(createdContactFullName);
    await contactPage.openContactByName(createdContactFullName);
    await contactPage.openEditDrawer();

    await contactPage.fillEditForm({
      jobTitle: 'Updated QA Title',
      phone: '1234567890',
      cellPhone: '1234567891'
    });
    await expect(contactPage.saveContactBtn).toBeEnabled();

    await contactPage.submitEditForm();
    await expect(contactPage.editDrawerHeading).not.toBeVisible();
  });

  test('TC-CN-015 | Cancel Edit Contact closes drawer', async () => {
<<<<<<< ours
    expect(createdContactFullName).toBeTruthy();
=======
    await ensureCreatedContactExists();
>>>>>>> theirs
    await contactPage.searchContact(createdContactFullName);
    await contactPage.openContactByName(createdContactFullName);
    await contactPage.openEditDrawer();

    await contactPage.firstNameField.fill('SHOULD_NOT_SAVE');
    await contactPage.cancelEditForm();

    await expect(contactPage.editDrawerHeading).not.toBeVisible();
    await expect(page.getByRole('heading', { name: createdContactFullName, level: 3 })).toBeVisible();
  });

  test('TC-CN-016 | Sort by Contact Name column', async () => {
    await contactPage.assertContactsTableVisible();
    await contactPage.sortByContactName();

    await expect(contactPage.contactsTable).toBeVisible();
    expect(await page.getByRole('table').getByRole('row').count()).toBeGreaterThan(1);
  });

  test('TC-CN-017 | Pagination next page shows new records', async () => {
    const initialInfo = await contactPage.getPaginationText();
    expect(initialInfo).toMatch(/1–10 of/);
    await expect(contactPage.prevPageBtn).toBeDisabled();

    await contactPage.nextPageBtn.click();
    await page.waitForTimeout(500);

    const nextInfo = await contactPage.getPaginationText();
    expect(nextInfo).toMatch(/11–20 of/);
    await expect(contactPage.prevPageBtn).toBeEnabled();
  });
<<<<<<< ours
=======

  registerNotesTasksSuite({
    test,
    moduleName: 'Contact',
    getPage: () => page,
    openEntityDetail: openCreatedContactDetail,
  });
>>>>>>> theirs
});
