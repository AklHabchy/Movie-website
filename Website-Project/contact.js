class ContactForm {
  constructor() {
    this.form = document.getElementById('contactForm');
    this.nameInput = document.getElementById('name');
    this.emailInput = document.getElementById('email');
    this.messageInput = document.getElementById('message');
    this.successAlert = document.getElementById('formSuccess');
    this.init();
  }

  init() {
    this.form.addEventListener('input', (e) => this.validateField(e.target));
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  validateField(field) {
    if (field === this.nameInput) {
      this.toggleValidation(field, field.value.trim().length > 0);
    } else if (field === this.emailInput) {
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
      this.toggleValidation(field, valid);
    } else if (field === this.messageInput) {
      this.toggleValidation(field, field.value.trim().length > 0);
    }
  }

  toggleValidation(field, isValid) {
    if (isValid) {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
    } else {
      field.classList.remove('is-valid');
      field.classList.add('is-invalid');
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    const isNameValid = this.nameInput.value.trim().length > 0;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.emailInput.value);
    const isMessageValid = this.messageInput.value.trim().length > 0;
    this.toggleValidation(this.nameInput, isNameValid);
    this.toggleValidation(this.emailInput, isEmailValid);
    this.toggleValidation(this.messageInput, isMessageValid);
    if (isNameValid && isEmailValid && isMessageValid) {
      this.form.reset();
      [this.nameInput, this.emailInput, this.messageInput].forEach(f => {
        f.classList.remove('is-valid');
      });
      this.successAlert.classList.remove('d-none');
      setTimeout(() => {
        this.successAlert.classList.add('d-none');
      }, 3000);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ContactForm();
}); 