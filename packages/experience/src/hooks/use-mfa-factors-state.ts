import { useLocation } from 'react-router-dom';
import { z } from 'zod';

import { mfaFlowStateGuard } from '@/types/guard';

const useMfaFlowState = () => {
  const { state } = useLocation();
  const { data: mfaFlowState } = mfaFlowStateGuard.safeParse(state);

  return mfaFlowState;
};

export default useMfaFlowState;
