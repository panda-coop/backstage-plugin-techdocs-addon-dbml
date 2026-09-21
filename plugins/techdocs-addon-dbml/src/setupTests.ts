import '@testing-library/jest-dom';

// jsdom does not implement scrollIntoView, which the TechDocs reader calls.
Element.prototype.scrollIntoView = jest.fn();
