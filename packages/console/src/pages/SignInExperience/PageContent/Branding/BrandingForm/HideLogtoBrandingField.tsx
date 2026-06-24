import { useFormContext } from 'react-hook-form';

import FormField from '@/ds-components/FormField';
import Switch from '@/ds-components/Switch';

import type { SignInExperienceForm } from '../../../types';

type Props = {
  readonly variant?: 'cloud' | 'oss';
  readonly isEnabledInCloud?: boolean;
};

// Hypedrive self-hosted — "hide branding" is always available (no paid gate, no cloud upsell).
function HideLogtoBrandingField(_props: Props) {
  const { register } = useFormContext<SignInExperienceForm>();

  return (
    <FormField title="sign_in_exp.branding.hide_logto_branding">
      <Switch
        description="sign_in_exp.branding.hide_logto_branding_description"
        {...register('hideLogtoBranding')}
      />
    </FormField>
  );
}

export default HideLogtoBrandingField;
