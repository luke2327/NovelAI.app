import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { atom, useAtom, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { TrashIcon } from "@heroicons/react/24/solid";
import { Tag } from "./Tag";
import { useCallback } from "react";
import classNames from "classnames";
import { toast } from "react-hot-toast";
import { copyText } from "~/utils";

export const promptListAtom = atomWithStorage<
  { tag: string; pinned: boolean }[]
>("prompt-list", []);
export const updatePromptListAtom = atom(
  null,
  (get, set, { from, to }: { from: number; to: number }) => {
    const cloned = [...get(promptListAtom)];
    const item = get(promptListAtom)[from];

    cloned.splice(from, 1);
    cloned.splice(to, 0, item);
    set(promptListAtom, cloned);
  }
);

export const ResultBar = () => {
  const [promptList, setPromptList] = useAtom(promptListAtom);

  const copyPrompt = useCallback(() => {
    copyText(promptList.reduce((a, b) => `${a}${b.tag}, `, "").slice(0, -2));
    toast.success("프롬프트를 복사하였습니다!");
  }, [promptList]);

  const resetPrompt = useCallback(() => {
    setPromptList((prev) => prev.filter(({ pinned }) => pinned));
  }, [setPromptList]);

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-300 shadow-inner h-16 flex items-center justify-center select-none">
      {!promptList.length ? (
        <div className="text-gray-800 flex-grow px-6">
          태그를 클릭하여 이곳에 추가하세요!
        </div>
      ) : (
        <Droppable droppableId="result-bar" direction="horizontal">
          {(provided, snapshot) => (
            <div
              className="w-full flex items-center px-6 flex-grow"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {promptList.map((item, key) => (
                <Draggable key={item.tag} index={key} draggableId={item.tag}>
                  {(provided, snapshot) => (
                    <Tag
                      key={key}
                      selected={item.pinned}
                      left={() =>
                        item.pinned ? (
                          <></>
                        ) : (
                          <TrashIcon
                            width={18}
                            height={18}
                            onClick={() => {
                              setPromptList((prev) =>
                                prev.filter((_, index) => index !== key)
                              );
                            }}
                          />
                        )
                      }
                      onSelect={() => {
                        setPromptList((prev) => {
                          const cloned = [...prev];
                          if (!cloned[key]) return cloned;
                          cloned[key].pinned = !cloned[key].pinned;
                          return cloned;
                        });
                      }}
                      label={item.tag}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="mr-2"
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
      <div className="mr-6 flex gap-x-3">
        <button
          className={classNames(
            "transition text-black rounded px-4 py-1.5 shadow-sm flex-none",
            promptList.length < 1
              ? "bg-gray-100 text-gray-400"
              : "bg-white hover:bg-gray-100 border border-gray-300 "
          )}
          onClick={resetPrompt}
          disabled={promptList.length < 1}
        >
          리셋
        </button>
        <button
          className={classNames(
            "transition rounded px-4 py-1.5 shadow-sm flex-none",
            promptList.length < 1
              ? "bg-gray-100 text-gray-400"
              : "bg-primary-600 hover:bg-primary-700 text-white"
          )}
          onClick={copyPrompt}
          disabled={promptList.length < 1}
        >
          복사
        </button>
      </div>
    </div>
  );
};