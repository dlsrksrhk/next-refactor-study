"use client";

type Props = {
  title: string;
  body: string;
  onChangeTitle: (title: string) => void;
  onChangeBody: (body: string) => void;
  titleElId: string;
  bodyElId: string;
  bodyRows?: number;
  focusTitle?: (input: HTMLInputElement | null) => void;
};

export function ArticleFields({
  title,
  body,
  onChangeTitle,
  onChangeBody,
  titleElId,
  bodyElId,
  bodyRows,
  focusTitle,
}: Props) {
  const bodyLengthId = `${bodyElId}-length`;

  return (
    <>
      <label htmlFor={titleElId}>제목</label>
      <input
        id={titleElId}
        ref={focusTitle}
        value={title}
        onChange={(event) => onChangeTitle(event.target.value)}
      />
      <label htmlFor={bodyElId}>본문</label>
      <textarea
        id={bodyElId}
        aria-describedby={bodyLengthId}
        rows={bodyRows}
        value={body}
        onChange={(event) => onChangeBody(event.target.value)}
      />
      <p
        id={bodyLengthId}
        className="article-body-count"
      >
        본문 {body.length}자
      </p>
    </>
  );
}
