import UserAvatar from '@experience/assets/icons/default-user-avatar.svg?react';
import AvatarCropModal from '@experience/components/AvatarCropModal';
import useAvatarCropUpload from '@experience/hooks/use-avatar-crop-upload';
import RotatingRingIcon from '@experience/shared/components/Button/RotatingRingIcon';
import { avatarFileAccept } from '@experience/utils/avatar-upload';
import { useLogto } from '@logto/react';
import classNames from 'classnames';
import { useCallback, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { uploadAccountAvatar } from '@ac/apis/avatar';
import { layoutClassNames } from '@ac/constants/layout';

const rowClass =
  'grid grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto] grid-flow-dense gap-x-6 items-center py-5 px-6 min-h-16 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-[var(--color-line-divider)] mobile:flex mobile:flex-col mobile:items-stretch mobile:gap-1 mobile:p-4 mobile:min-h-0';
const topLineClass =
  'contents mobile:flex mobile:items-center mobile:justify-between mobile:gap-3 mobile:w-full';
const nameClass =
  'col-start-1 min-w-0 text-sm font-medium text-ink mobile:w-full mobile:break-words';
const actionsClass =
  'col-start-3 flex items-center gap-6 flex-shrink-0 mobile:flex-wrap mobile:justify-end mobile:gap-4';
const changeButtonClass =
  'text-sm font-medium text-primary cursor-pointer bg-none border-none py-0.5 whitespace-nowrap hover:underline mobile:p-0 mobile:whitespace-normal mobile:text-start';
const valueClass = 'col-start-2 min-w-0 text-sm text-ink [overflow-wrap:anywhere] break-words';
const avatarClass = 'w-8 h-8 rounded-[8px] object-cover block';

type Props = {
  readonly className?: string;
  readonly label: string;
  readonly value?: string;
  readonly onChange: (value: string) => void | Promise<void>;
};

const AvatarUploadField = ({ className, label, value = '', onChange }: Props) => {
  const { t } = useTranslation();
  const { t: tAvatar } = useTranslation(undefined, { keyPrefix: 'profile.avatar_upload' });
  const { getAccessToken } = useLogto();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File, options: { signal: AbortSignal }) => {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error('Session expired');
      }

      return uploadAccountAvatar(accessToken, file, options);
    },
    [getAccessToken]
  );

  const {
    cropImageSource,
    isUploading,
    uploadError,
    fileInputKey,
    handleFileChange,
    handleCropCancel,
    handleCropConfirm,
  } = useAvatarCropUpload({ upload, onChange });

  const openFilePicker = useCallback(() => {
    if (isUploading) {
      return;
    }

    inputRef.current?.click();
  }, [isUploading]);

  const actionLabel = isUploading
    ? tAvatar('uploading')
    : value
      ? t('account_center.security.change')
      : tAvatar('upload');

  return (
    <div className={classNames(rowClass, layoutClassNames.row, className)}>
      <div className={topLineClass}>
        <label className={nameClass} htmlFor={inputId}>
          {label}
        </label>
        <div className={actionsClass}>
          <button
            type="button"
            className={changeButtonClass}
            disabled={isUploading}
            onClick={openFilePicker}
          >
            {actionLabel}
          </button>
        </div>
      </div>
      <div className={valueClass}>
        <div className="flex flex-col items-start gap-1">
          {isUploading ? (
            <div className="w-8 h-8 text-primary">
              <RotatingRingIcon />
            </div>
          ) : value ? (
            <img className={avatarClass} src={value} alt={label} referrerPolicy="no-referrer" />
          ) : (
            <UserAvatar className="w-8 h-8 rounded-[8px]" />
          )}
          {uploadError && !cropImageSource && (
            <span className="text-xs text-danger" role="alert">
              {uploadError}
            </span>
          )}
        </div>
      </div>
      <input
        key={fileInputKey}
        ref={inputRef}
        id={inputId}
        className="hidden"
        type="file"
        accept={avatarFileAccept}
        onChange={handleFileChange}
      />
      <AvatarCropModal
        imageSource={cropImageSource}
        isUploading={isUploading}
        uploadError={uploadError}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
};

export default AvatarUploadField;
