import { CustomProfileFieldType, type CustomProfileField } from '@logto/schemas';
import { condString } from '@silverhand/essentials';
import { useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import AvatarUploadField from '@/components/InputFields/AvatarUploadField';
import PrimitiveProfileInputField from '@/components/InputFields/PrimitiveProfileInputField';
import Button from '@/shared/components/Button';

import AddressSubForm from './AddressSubForm';
import FullnameSubForm from './FullnameSubForm';
import useFieldLabel from './use-field-label';
import useValidateField from './use-validate-field';

type Props = {
  readonly customProfileFields: CustomProfileField[];
  readonly defaultValues?: Record<string, unknown>;
  readonly onSubmit: (values: Record<string, unknown>) => Promise<void>;
};

const ExtraProfileForm = ({ customProfileFields, defaultValues, onSubmit }: Props) => {
  const getFieldLabel = useFieldLabel();
  const validateField = useValidateField();
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const methods = useForm<Record<string, unknown>>({
    reValidateMode: 'onBlur',
    defaultValues,
  });

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = methods;

  const submit = handleSubmit(async (value) => {
    if (isAvatarUploading) {
      return;
    }

    await onSubmit(value);
  });

  return (
    <FormProvider {...methods}>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        {customProfileFields.map((field) => {
          if (field.type === CustomProfileFieldType.Fullname) {
            return <FullnameSubForm key={field.name} field={field} />;
          }
          const { name, type, label, description, required } = field;
          return (
            <Controller
              key={name}
              control={control}
              name={name}
              rules={{
                validate: (value) =>
                  validateField(value, { ...field, description: condString(description) }),
              }}
              render={({ field: { onBlur, onChange, value } }) => {
                if (type === CustomProfileFieldType.Address) {
                  return <AddressSubForm field={field} />;
                }

                if (name === 'avatar' && type === CustomProfileFieldType.Url) {
                  const stringValue = z.string().optional().parse(value);

                  return (
                    <AvatarUploadField
                      name={name}
                      label={label || getFieldLabel(name)}
                      description={condString(description)}
                      isRequired={required}
                      value={stringValue}
                      errorMessage={errors[name]?.message}
                      onChange={onChange}
                      onBlur={onBlur}
                      onUploadingChange={setIsAvatarUploading}
                    />
                  );
                }

                const stringValue = z.string().optional().parse(value);
                return (
                  <PrimitiveProfileInputField
                    {...field}
                    name={name}
                    label={label || getFieldLabel(name)}
                    description={condString(description)}
                    required={required}
                    value={stringValue}
                    isDanger={!!errors[name]}
                    errorMessage={errors[name]?.message}
                    onChange={onChange}
                    onBlur={onBlur}
                  />
                );
              }}
            />
          );
        })}
        <Button
          title="action.continue"
          htmlType="submit"
          isLoading={isSubmitting}
          isDisabled={isAvatarUploading}
        />
        <input hidden type="submit" disabled={isAvatarUploading} />
      </form>
    </FormProvider>
  );
};

export default ExtraProfileForm;
