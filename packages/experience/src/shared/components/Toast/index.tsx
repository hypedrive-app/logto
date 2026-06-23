import { useEffect, useState } from 'react';
import ReactModal from 'react-modal';

type Props = {
  readonly message: string;
  readonly duration?: number;
  readonly callback?: () => void;
};

const Toast = ({ message, duration = 3000, callback }: Props) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!message) {
      return;
    }

    setText(message);

    const timer = setTimeout(() => {
      callback?.();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
    // `text` is intentionally excluded: it's set inside this effect, so including it
    // would re-run the effect and reset the dismiss timer once on every show.
  }, [callback, duration, message]);

  return (
    <ReactModal
      shouldFocusAfterRender={false}
      // For styling use
      // eslint-disable-next-line jsx-a11y/aria-role
      role="toast"
      isOpen={Boolean(message)}
      overlayClassName="fixed top-1/2 left-0 right-0 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-[var(--z-toast)]"
      className="mx-auto py-2 px-4 max-w-[min(295px,calc(100vw-32px))] text-base text-white rounded-[13px] bg-[var(--color-bg-toast)] text-center break-words pointer-events-auto focus-visible:outline-none desktop:py-3 desktop:shadow-[var(--sh-float)]"
      closeTimeoutMS={300}
    >
      {text}
    </ReactModal>
  );
};

export default Toast;
