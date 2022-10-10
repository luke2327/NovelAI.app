import type { NextPage } from "next";
import { useCallback, useMemo, useState } from "react";
import { NextSeo } from "next-seo";
import tags from "~/assets/tags.json";
import { Tag, TagCard } from "~/components";
import { useDebounce } from "use-debounce";
import { ResultBar, updatePromptListAtom } from "~/components/ResultBar";
import { useSetAtom } from "jotai";
import { DragDropContext } from "react-beautiful-dnd";

const searchRegex = /([가-힇a-zA-Z_/]+|"[가-힇a-zA-Z_/ ]+")/g;

export const Home: NextPage = () => {
  const [selected, setSelected] = useState<string>("");
  const [text, setText] = useState("");
  const [debouncedText] = useDebounce(text, 300);
  const updatePromptList = useSetAtom(updatePromptListAtom);

  const disabled = useMemo(() => text.length > 0, [text]);
  const onSelectTag = useCallback((label: string) => {
    setSelected((prev) => (prev === label ? "" : label));
  }, []);

  const filtered = useMemo(() => {
    if (!disabled) {
      return selected === ""
        ? tags
        : tags.filter(({ category }) => category === selected);
    }
    const matched =
      debouncedText.match(searchRegex)?.map((text) => {
        text = text.toLowerCase();
        if (text.startsWith('"')) {
          return {
            keyword: text.substring(1).slice(0, -1),
            isFull: true,
            isEnglish: !!text.match(/^[a-zA-Z_]+$/),
            hasSpace: text.includes(" "),
          };
        }
        return {
          keyword: text,
          isCategory: text.includes("/"),
          isEnglish: !!text.match(/^[a-zA-Z_]+$/),
        };
      }) ?? null;
    if (!matched) return [];

    const result = tags.filter((tag) => {
      for (const data of matched) {
        if (data.isFull) {
          if (data.isEnglish)
            return tag.tags.toLowerCase().includes(data.keyword);
          if (data.hasSpace) {
            if (tag.name.includes(data.keyword)) return true;
          } else {
            if (tag.category.includes(data.keyword)) return true;
            if (tag.subCategory.includes(data.keyword)) return true;
            if (`${tag.category}/${tag.subCategory}`.includes(data.keyword))
              return true;
          }
          return false;
        }

        if (data.isCategory) {
          return `${tag.category}/${tag.subCategory}`.includes(data.keyword);
        }

        if (data.isEnglish) {
          return tag.tags.toLowerCase().includes(data.keyword);
        }

        if (tag.name.includes(data.keyword)) return true;
        if (tag.category.includes(data.keyword)) return true;
        if (tag.subCategory.includes(data.keyword)) return true;
      }
      return false;
    });
    return result;
  }, [debouncedText, disabled, selected]);

  return (
    <>
      <NextSeo title="NovelAI Helper" description="NovelAI 태그 생성기" />
      <DragDropContext
        onDragEnd={({ destination, source }) => {
          updatePromptList({ from: source.index, to: destination?.index || 0 });
        }}
      >
        <div className="bg-slate-50 min-h-full pb-4">
          <header className="pt-32">
            <h1 className="text-center text-4xl font-bold">
              NovelAI 태그 생성기
            </h1>
            <div className="text-center text-gray-800 mt-1">
              <b>
                본 웹사이트는 Anlatan사의 NovelAI와 직접적인 관련이 없습니다.
              </b>
              <br />
              NovelAI 사용시 유용한 태그를 찾는 사이트입니다.
              <br />
              아직 개발 중이며 로드맵은{" "}
              <a href="https://github.com/gangjun06/NovelAI-helper/issues/1">
                이곳
              </a>{" "}
              에서 보실 수 있습니다.
              <br />
              <div className="flex gap-3 justify-center mt-1">
                <a href="mailto:me@gangjun.dev">문의</a>
                <a
                  href="https://github.com/gangjun06/novelai-helper"
                  target="_blank"
                  rel="noreferrer"
                >
                  소스코드(깃허브)
                </a>
                <a
                  href="https://toss.me/gangjun"
                  target="_blank"
                  rel="noreferrer"
                >
                  개발자에게 커피 선물하기
                </a>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 mt-8">
            <section className="flex w-full items-center flex-col">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="키워드/태그를 입력하여 주세요"
                className="basic"
              />
              <div className="flex flex-wrap gap-2 mt-3 select-none">
                {[
                  ...new Set(
                    tags.reduce<string[]>((a, b) => [...a, b.category], [])
                  ),
                ].map((text) => (
                  <Tag
                    label={text}
                    key={text}
                    disabled={disabled}
                    selected={selected === text}
                    onSelect={() => onSelectTag(text)}
                  />
                ))}
              </div>
            </section>
            <section className="mt-4 grid grid-cols-4 gap-4">
              {filtered.map(({ id, category, subCategory, name, tags }) => (
                <TagCard
                  key={id}
                  title={`${category}/${subCategory} - ${name}`}
                  text={tags}
                />
              ))}
            </section>
          </main>
        </div>
        <ResultBar />
      </DragDropContext>
    </>
  );
};