import { Controller, useFormContext } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import CustomCssEditorField from '@/components/CustomCssEditorField';
import Card from '@/ds-components/Card';
import FormField from '@/ds-components/FormField';
import TextLink from '@/ds-components/TextLink';
import useDocumentationUrl from '@/hooks/use-documentation-url';
import CustomUiAssetsUploader from '@/pages/SignInExperience/components/CustomUiAssetsUploader';

import type { SignInExperienceForm } from '../../../types';
import FormSectionTitle from '../../components/FormSectionTitle';

import CustomUiCspForm from './CustomUiCspForm';

// Hypedrive self-hosted — "Bring your UI" works against the Management API, so the
// uploader is rendered for everyone (no cloud gate, no "try Cloud" upsell card).
function CustomUiForm() {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const { getDocumentationUrl } = useDocumentationUrl();
  const { control } = useFormContext<SignInExperienceForm>();

  return (
    <>
      <Card>
        <FormSectionTitle title="custom_ui.css_code_editor_title" />
        <CustomCssEditorField />
      </Card>
      <Card>
        <FormSectionTitle title="custom_ui.bring_your_ui_title" />
        <FormField
          title="sign_in_exp.custom_ui.bring_your_ui_upload_title"
          description={
            <Trans
              components={{
                a: (
                  <TextLink
                    targetBlank="noopener"
                    href={getDocumentationUrl('/docs/recipes/customize-sie/bring-your-ui')}
                  />
                ),
              }}
            >
              {t('sign_in_exp.custom_ui.bring_your_ui_description')}
            </Trans>
          }
          descriptionPosition="top"
        >
          <Controller
            name="customUiAssets"
            control={control}
            render={({ field: { onChange, value } }) => (
              <CustomUiAssetsUploader value={value} onChange={onChange} />
            )}
          />
        </FormField>
        <CustomUiCspForm />
      </Card>
    </>
  );
}

export default CustomUiForm;
