import type { FormEventHandler, KeyboardEventHandler } from 'react';
import { useEffect, useRef, useState } from 'react';

import SearchIcon from '@/assets/icons/search.svg?react';

import Button from '../Button';
import TextInput from '../TextInput';

import styles from './index.module.scss';

type Props = {
  readonly defaultValue?: string;
  readonly isClearable?: boolean;
  readonly placeholder?: string;
  readonly inputClassName?: string;
  readonly onSearch?: (value: string) => void;
  readonly onClearSearch?: () => void;
};

/**
 * The body-2 font declared in @logto/core-kit/scss/fonts. It is referenced here to calculate the
 * width of the placeholder text, which determines the minimum width of the search input field.
 */
const fontBody2 =
  '400 14px / 20px -apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif, Apple Color Emoji';

function Search({
  defaultValue = '',
  isClearable = false,
  placeholder = '',
  inputClassName,
  onSearch,
  onClearSearch,
}: Props) {
  const [inputValue, setInputValue] = useState<string>(defaultValue);
  const [minInputWidth, setMinInputWidth] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSearchKeyPress: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter' && inputValue) {
      onSearch?.(inputValue);
    }
  };

  const handleSearchChange: FormEventHandler<HTMLInputElement> = (event) => {
    setInputValue(event.currentTarget.value);
  };

  const handleClick = () => {
    onSearch?.(inputValue);
  };

  useEffect(() => {
    // Render placeholder text in canvas to calculate its width in CSS pixels.
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.font = fontBody2;
    setMinInputWidth(ctx.measureText(placeholder).width);
  }, [placeholder]);

  // A custom property (`--search-min-width`) isn't part of `CSSProperties`, so
  // type the style object as a string map — assignable to `style` without an
  // `as` cast (which the lint config forbids).
  const searchMinWidthStyle: Record<string, string> = {
    '--search-min-width': `${minInputWidth}px`,
  };

  return (
    <div className={styles.search}>
      <canvas ref={canvasRef} />
      <TextInput
        className={inputClassName}
        value={inputValue}
        icon={<SearchIcon className={styles.searchIcon} />}
        placeholder={placeholder}
        // Expose the canvas-measured min width as a custom property so the
        // stylesheet can apply it on desktop yet drop it on phones (where the
        // input wraps to full width) without needing `!important`.
        style={searchMinWidthStyle}
        onChange={handleSearchChange}
        onKeyPress={handleSearchKeyPress}
      />
      <Button title="general.search" onClick={handleClick} />
      {isClearable && (
        <Button
          size="small"
          type="text"
          title="general.clear_result"
          onClick={() => {
            setInputValue('');
            onClearSearch?.();
          }}
        />
      )}
    </div>
  );
}

export default Search;
