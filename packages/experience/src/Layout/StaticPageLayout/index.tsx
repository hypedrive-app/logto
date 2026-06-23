type Props = {
  readonly children: React.ReactNode;
};

const StaticPageLayout = ({ children }: Props) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-start self-stretch animate-[content-enter_0.35s_ease-out_both]">
      {children}
    </div>
  );
};

export default StaticPageLayout;
