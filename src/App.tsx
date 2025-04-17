import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';

const validateLuhn = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\s+/g, '');
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

const formatCardNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const maskCardNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 6) return value;
  const firstTwo = digits.slice(0, 2);
  const lastFour = digits.slice(-4);
  const maskedMiddle = '*'.repeat(digits.length - 6);
  const masked = `${firstTwo}${maskedMiddle}${lastFour}`;
  return masked.replace(/(.{4})/g, '$1 ').trim();
};

interface CardFormValues {
  cardNumber: string;
  cvv: string;
  expiryDate: Date | null;
  amount: number | '';
  currency: string;
}

const currencies = ['USD', 'EUR', 'RUB'];

const App: React.FC = () => {
  const initialValues: CardFormValues = {
    cardNumber: '',
    cvv: '',
    expiryDate: null,
    amount: '',
    currency: currencies[0],
  };

  const validationSchema = Yup.object({
    cardNumber: Yup.string()
      .required('Введите номер карты')
      .test('luhn-test', 'Неверный номер карты', (value = '') => {
        const digits = value.replace(/\s+/g, '');
        if (!/^\d+$/.test(digits) || digits.length < 12) return false;
        return validateLuhn(value);
      }),
    cvv: Yup.string()
      .required('Введите CVV')
      .matches(/^\d{3,4}$/, 'CVV должно состоять из 3 или 4 цифр'),
    expiryDate: Yup.date()
      .required('Выберите дату истечения')
      .typeError('Неверный формат даты'),
    amount: Yup.number()
      .required('Введите сумму пополнения')
      .typeError('Введите числовое значение')
      .positive('Сумма должна быть положительной'),
    currency: Yup.string().required('Выберите валюту'),
  });

  const handleSubmit = (
    values: CardFormValues,
    actions: FormikHelpers<CardFormValues>
  ) => {
    console.log('Отправка формы:', values);
    actions.setSubmitting(false);
  };

  const [cardInputFocused, setCardInputFocused] = useState(false);

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const month = date.getMonth() + 1;
    const year = date.getFullYear() % 100;
    return `${month}/${year}`;
  };

  return (
    <div className="outer-container">
      <div className="app-container">
        <h2>Информация о карте</h2>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, isValid, dirty, handleBlur }) => (
            <Form className="card-form">
              <div className="form-group">
                <label htmlFor="cardNumber">Номер карты</label>
                <Field name="cardNumber">
                  {({ field }: any) => (
                    <input
                      {...field}
                      id="cardNumber"
                      name="cardNumber"
                      placeholder="XXXX XXXX XXXX XXXX"
                      value={
                        cardInputFocused
                          ? formatCardNumber(field.value)
                          : field.value
                            ? maskCardNumber(field.value)
                            : ''
                      }
                      onFocus={() => {
                        setCardInputFocused(true);
                        setFieldValue(
                          'cardNumber',
                          field.value.replace(/\D/g, '')
                        );
                      }}
                      onBlur={(e) => {
                        setCardInputFocused(false);
                        handleBlur(e);
                        setFieldValue(
                          'cardNumber',
                          formatCardNumber(e.target.value)
                        );
                      }}
                      onChange={(e) => {
                        const formatted = formatCardNumber(e.target.value);
                        setFieldValue('cardNumber', formatted);
                      }}
                      className="input-field"
                    />
                  )}
                </Field>
                <ErrorMessage
                  name="cardNumber"
                  component="div"
                  className="error-message"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cvv">CVV</label>
                <Field name="cvv">
                  {({ field }: any) => (
                    <input
                      {...field}
                      id="cvv"
                      name="cvv"
                      placeholder="***"
                      type="password"
                      className="input-field"
                      onBlur={handleBlur}
                    />
                  )}
                </Field>
                <ErrorMessage name="cvv" component="div" className="error-message" />
              </div>

              <div className="form-group">
                <label htmlFor="expiryDate">Дата истечения (ММ/YY)</label>
                <DatePicker
                  selected={values.expiryDate}
                  onChange={(date: Date | null) => {
                    if (date === null) {
                      const inputValue = (event?.target as HTMLInputElement).value;
                      const parsedDate = new Date(`20${inputValue}`);
                      if (!isNaN(parsedDate.getTime())) {
                        setFieldValue('expiryDate', parsedDate);
                      }
                    } else {
                      setFieldValue('expiryDate', date);
                    }
                  }}
                  dateFormat="MM/yy"
                  showMonthYearPicker
                  placeholderText="ММ/YY"
                  className="input-field"
                />
                <ErrorMessage
                  name="expiryDate"
                  component="div"
                  className="error-message"
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Сумма пополнения</label>
                <div className="input-currency-group">
                  <Field
                    name="amount"
                    id="amount"
                    placeholder="Сумма"
                    type="number"
                    className="input-field"
                  />
                  <Field
                    as="select"
                    name="currency"
                    id="currency"
                    className="select-field"
                  >
                    {currencies.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </Field>
                </div>
                <ErrorMessage
                  name="amount"
                  component="div"
                  className="error-message"
                />
                <ErrorMessage
                  name="currency"
                  component="div"
                  className="error-message"
                />
              </div>

              <button
                type="submit"
                disabled={!(isValid && dirty)}
                className="submit-button"
              >
                Отправить
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default App;

