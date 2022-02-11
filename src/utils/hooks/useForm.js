import {useState} from 'react';
import {validator} from 'utils';

export default (initialForm = {}, descriptor = {}) => {
  const _form = {};
  const _title = {};
  Object.keys(initialForm).map((key) => {
    _form[key] = initialForm[key].value;
    _title[key] = initialForm[key].title;
  });

  const [form, setForm] = useState(JSON.parse(JSON.stringify(_form)));
  const [message, setMessage] = useState({});

  const _setForm = (object) => {
    if (object === null) {
      setForm(JSON.parse(JSON.stringify(_form)));
      setMessage({});
      return;
    }
    if (typeof object === 'object') {
      setForm({
        ...form,
        ...object,
      });
      const _resetMessage = {};
      Object.keys(object).map((key) => {
        _resetMessage[key] = '';
        return key;
      });
      setMessage({
        ...message,
        ..._resetMessage,
      });
    }
  };

  const _validateForm = async () => {
    try {
      await validator(descriptor, form, _title);
      return true;
    } catch (error) {
      setMessage(error);
      return false;
    }
  };

  return [form, message, _setForm, _validateForm];
};
