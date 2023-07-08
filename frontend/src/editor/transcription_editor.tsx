import { Editor, Transforms, Range, Operation } from 'slate';
import {
  Slate,
  Editable,
  RenderElementProps,
  RenderLeafProps,
} from 'slate-react';
import { SpeakerDropdown } from './speaker_dropdown';
import { useEvent } from '../utils/use_event';
import { SeekToEvent } from './types';
import { startTimeToClassName } from './player';
import clsx from 'clsx';
import { ComponentProps, useCallback, memo } from 'react';
import { useMediaQuery } from '../utils/use_media_query';
import { createPortal } from 'react-dom';
import {
  SpeakerBlocks,
  useSpeakerBlocks,
  useSpeakerColors,
  useSpeakerName,
} from '../utils/document';
import { id } from '../utils/id';
import { CssRule } from '../utils/cssdom';

export function formattedTime(sec: number | undefined): string {
  if (sec === undefined) {
    return 'unknown';
  }

  const seconds = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((sec / 60) % 60)
    .toString()
    .padStart(2, '0');
  const hours = Math.floor(sec / 60 / 60)
    .toString()
    .padStart(2, '0');
  if (Math.floor(sec / 60 / 60) > 0) {
    return `${hours}:${minutes}:${seconds}`;
  }
  return `${minutes}:${seconds}`;
}

function Paragraph({ element, children, attributes }: RenderElementProps): JSX.Element {
  const startAtom = element.children[0];
  const speakerColors = useSpeakerColors();
  const speakerName = useSpeakerName(element.speaker);

  let portalNode = document.getElementById('meta-portal');
  if (portalNode == null) {
    const gridNode = document.getElementsByClassName('grid')[0];
    portalNode = document.createElement('div');
    portalNode.id = 'meta-portal';
    portalNode.style.display = 'contents';
    if (gridNode.children.length == 0) {
      gridNode.appendChild(portalNode);
    } else {
      gridNode.insertBefore(gridNode.children[0], portalNode);
    }
  }

  const speakerChanged = false;
  const speakerLast = false;

  const metaInformation = (
    <div
      className="contents"
      id={`paragraph-${id(element)}`}
    >
      {/* speaker color indicator */}
      <div
          contentEditable={false}
          style={{
            backgroundColor: element.speaker && speakerColors[element.speaker],
          }}
          className={clsx(
            'w-2 mr-2 h-full rounded-md',
            'row-start-[calc(var(--element-idx)*3+1)]',
            'row-end-[calc(var(--current-speaker-end-idx)*3+3)]',
            'col-start-2',
            'md:col-start-3',
            'xl:mr-4',
          )}
        />

        {/* start time */}
        <div
          contentEditable={false}
          className={clsx(
            `text-slate-500 dark:text-neutral-400 font-mono`,
            'row-start-[calc(var(--element-idx)*3+1)] col-start-3',
            speakerChanged && 'md:row-start-[calc(var(--element-idx)*3+2)]',
            'xl:row-start-[calc(var(--element-idx)*3+1)]',
            'md:col-start-2',
            'xl:col-start-1 xl:mr-4',
          )}
          onClick={() => window.dispatchEvent(new SeekToEvent(startAtom.start))}
        >
          {formattedTime(startAtom.start)}
        </div>

        {/* speaker names */}
        {speakerChanged && (
          <div
            contentEditable={false}
            className={clsx(
              'hidden md:block',
              'col-start-2 h-full',
              'row-start-[calc(var(--element-idx)*3+1)]',
              'row-end-[calc(var(--current-speaker-end-idx)*3+3)]',
              'overflow-clip',
            )}
          >
            <div
              className={clsx(
                'sticky top-0',
                '-mt-[0.1rem] py-1 mr-1',
                'max-w-none break-all text-neutral-500',
                'text-sm font-semibold',
                'md:max-w-[200px] md:text-neutral-600 md:dark:text-neutral-200 xl:text-right',
                'bg-white dark:bg-neutral-900',
                'xl:pr-3',
              )}
            >
              {speakerName}
            </div>
          </div>
        )}
        <SpeakerDropdown
          paragraph={element}
          contentEditable={false}
          buttonClassName={clsx(
            'max-w-none break-all text-neutral-500',
            'md:max-w-[200px] md:text-neutral-600 md:dark:text-neutral-200 xl:text-right',
            'xl:pr-2',
            'md:opacity-0 md:hover:opacity-100',
          )}
          dropdownContainerClassName="pb-24"
          className={clsx(
            'mx-2',
            'row-start-[calc(var(--element-idx)*3+1)] col-start-4',
            '-mt-0.5 xl:mt-0',
            'md:col-start-2 md:-ml-2',
          )}
        />

        {/* helper for bottom padding */}
        <div
          className={clsx(
            'mb-6 md:mb-1 xl:mb-3',
            'row-start-[calc(var(--element-idx)*3+3)]',
            speakerLast && 'md:mb-2',
          )}
        />
    </div>
  );

  return (
    <>
      {portalNode && createPortal(metaInformation, portalNode)}
      <div
        {...attributes}
        id={`paragraph-${id(element)}`}
        className={clsx(
          `col-start-2 col-span-2`,
          'row-start-[calc(var(--element-idx)*3+2)] col-start-3',
          'md:row-start-[calc(var(--element-idx)*3+1)] md:row-span-2 md:col-start-4 md:col-span-1',
          'md:mb-2',
        )}
        lang={element.lang}
        spellCheck={false}
      >
        {children}
      </div>
    </>
  );
}

const Leaf = memo(
  ({
    start,
    conf,
    children,
    attributes,
    systemPrefersDark,
  }: {
    start?: number;
    conf?: number;
    children: RenderLeafProps['children'];
    attributes: RenderLeafProps['attributes'];
    systemPrefersDark: boolean;
  }): JSX.Element => {
    const color = !conf
      ? undefined
      : systemPrefersDark
      ? `hsl(0, 100%, ${Math.min(conf * 50 + 50, 100)}%)`
      : `hsl(0, 100%, ${Math.min((1 - conf) * 100, 45)}%)`;

    const classes = ['word'];
    if (start !== undefined) {
      classes.push(startTimeToClassName(start));
    }

    return (
      <span
        {...attributes}
        className={classes.join(' ')}
        onClick={() => {
          // this event is handeled in player.tsx to set the time when someone clicks a word
          window.dispatchEvent(new SeekToEvent(start));
        }}
        style={{ color }}
      >
        {children}
      </span>
    );
  },
);

Leaf.displayName = 'Leaf';

export function TranscriptionEditor({
  editor,
  ...props
}: {
  editor: Editor;
} & ComponentProps<'div'>) {
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  // prevent ctrl+s
  useEvent('keydown', (e: KeyboardEvent) => {
    const ctrlOrCmd = window.navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey;
    if (ctrlOrCmd && e.key === 's') {
      e.preventDefault();
      console.log('CommandOrControl + S prevented – we automatically save the document anyways');
    }
  });

  const speakerBlocks = useSpeakerBlocks(editor);
  const paras: {id: number, idx: number, block: SpeakerBlocks[0]}[] = []
  speakerBlocks.forEach(block => {
    for (let i = block.start; i < block.end; i++) {
      paras.push({id: id(editor.children[i]), idx: i, block})
    }
  })


  return (
    <div {...props}>
      {paras.map(p => <CssRule key={p.id} css={`#paragraph-${p.id} {
        --element-idx: ${p.idx};
        --current-speaker-end-idx: ${p.block.end};
      }`} />)}
      <Slate
        editor={editor}
        value={
          [
            /* the value is actually managed by the editor object */
          ]
        }
        onChange={() => {
          // set the confidence of manually edited nodes to 1.0
          const hasChanged = editor.operations.some(
            (op: Operation) => op.type == 'insert_text' || op.type == 'remove_text',
          );
          if (hasChanged) {
            Transforms.setNodes(editor, { conf: 1.0 }, { match: (n) => 'conf' in n });
          }
        }}
      >
        <Editable
          renderElement={Paragraph}
          renderLeaf={useCallback(
            (props: RenderLeafProps) => {
              const { leaf, children, attributes } = props;
              return (
                <Leaf
                  attributes={attributes}
                  conf={leaf.conf}
                  start={leaf.start}
                  systemPrefersDark={systemPrefersDark}
                >
                  {children}
                </Leaf>
              );
            },
            [systemPrefersDark],
          )}
          onClick={(e: React.MouseEvent) => {
            const { selection } = editor;

            // fire a 'seek to' event when selection is changed by clicking outside of a text node
            // e.g. by clicking at the blank space on the right of a paragraph
            if (
              selection &&
              Range.isCollapsed(selection) &&
              e.target instanceof HTMLElement &&
              e.target.isContentEditable
            ) {
              const [leaf] = editor.leaf(selection.anchor);
              window.dispatchEvent(new SeekToEvent(leaf.start));
            }
          }}
          className={clsx(
            'grid items-start grid-cols-[min-content_max-content_min-content_1fr]',
            'md:auto-rows-[24px_auto_auto]',
            'xl:auto-rows-auto',
            '2xl:-ml-20',
          )}
        />
      </Slate>
    </div>
  );
}
