const { expect } = require('@playwright/test');

class HomePage {
  constructor(page) {
    this.page = page;
    this.getStartedLink = page.getByRole('link', { name: 'Get started' });
  }

  async goto() {
    await this.page.goto('/');
  }

  async openGetStarted() {
    await this.getStartedLink.click();
  }

  async assertDocsPage() {
    await expect(this.page).toHaveURL(/.*intro/);
  }
}

module.exports = { HomePage };
