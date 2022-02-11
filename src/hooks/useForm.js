import {useMemo, useState} from 'react';

export function useForm(fields, validators) {
  const [errors, setError] = useState({});
  const hasError = useMemo(() => {
    for (const field of fields) {
      const error = errors[field];
      if (error) {
        return true;
      }
      return false;
    }
  }, [errors, fields]);
  const form = fields.reduce((form, field) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState(null);

    form[field] = {
      value,
      change(text) {
        setValue(text);
        setError({
          ...errors,
          [field]: runValidator(text, validators[field], form),
        });
      },
    };
    return form;
  }, {});
  return {
    errors,
    hasError,
    form,
  };
}

function runValidator(value, validator, context) {}
