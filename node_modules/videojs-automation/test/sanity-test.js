describe('Google', function() {
  it('should have google in title', function() {
    browser.get('http://www.google.com');
    expect(browser.getTitle()).toContain('Google');
  });
});
