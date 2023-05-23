import { Editor, NodeEntry } from 'slate';
import { Slate, Editable, RenderElementProps, RenderLeafProps } from 'slate-react';
import { SpeakerDropdown } from './speaker_dropdown';
import { useEvent } from '../utils/use_event';
import { TextClickEvent } from './types';
import { startTimeToClassName } from './player';
import clsx from 'clsx';
import { useCallback, useEffect } from 'react';

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

function renderElement({ element, children, attributes }: RenderElementProps): JSX.Element {
  const startAtom = element.children[0];

  if (element.type === 'paragraph') {
    return (
      <>
        <div className="mb-6 flex">
          <div
            contentEditable={false}
            className="w-16 mr-2 -ml-20 hidden 2xl:block text-slate-500 dark:text-neutral-400 font-mono"
            onClick={() => window.dispatchEvent(new TextClickEvent(startAtom))}
          >
            {formattedTime(startAtom.start)}
          </div>

          <div contentEditable={false} className="w-56 mr-2 relative">
            <SpeakerDropdown paragraph={element} />
            <div
              className="mr-2 ml-7 2xl:hidden text-slate-500 dark:text-neutral-400 font-mono"
              onClick={() => window.dispatchEvent(new TextClickEvent(startAtom))}
            >
              {formattedTime(startAtom.start)}
            </div>
          </div>

          <div {...attributes} className="grow-1 basis-full" lang={element.lang}>
            {children}
          </div>
        </div>
      </>
    );
  }

  throw Error('Unknown element type');
}

function renderLeaf({ leaf, children, attributes }: RenderLeafProps): JSX.Element {
  const classes = ['word'];
  if (leaf.conf != undefined && leaf.conf < 0.7) {
    classes.push('text-red-600 dark:text-red-500');
  }
  if (leaf.start !== undefined) {
    classes.push(startTimeToClassName(leaf.start));
  }

  return (
    <span
      {...attributes}
      className={classes.join(' ')}
      onClick={() => {
        // this event is handeled in player.tsx to set the time when someone clicks a word
        window.dispatchEvent(new TextClickEvent(leaf));
      }}
    >
      {children}
    </span>
  );
}

export function TranscriptionEditor({
  editor,
  ...props
}: {
  editor: Editor;
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
  // prevent ctrl+s
  useEvent('keydown', (e: KeyboardEvent) => {
    const ctrlOrCmd = window.navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey;
    if (ctrlOrCmd && e.key === 's') {
      e.preventDefault();
      console.log('CommandOrControl + S prevented – we automatically save the document anyways');
    }
  });

  return (
    <div {...props} className={clsx('pb-40', props.className)}>
      <Slate
        editor={editor}
        value={
          [
            /* the value is actually managed by the editor object */
          ]
        }
      >
        <Editable
          renderElement={(props) => renderElement(props)}
          renderLeaf={renderLeaf}
          onClick={() => {
            const selection = document.getSelection();
            if (
              selection?.isCollapsed &&
              selection.anchorNode?.parentElement?.parentElement?.classList.contains('word')
            ) {
              selection.anchorNode.parentElement.click();
            }
          }}
        />
      </Slate>
    </div>
  );
}
