import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import { MOCK_MATERIALS } from '@/lib/academic-data';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { ReactRenderer } from '@tiptap/react';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export const CitationPluginKey = new PluginKey('citationSuggestion');

const CitationList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        if (props.items.length) {
          props.command(props.items[selectedIndex]);
        }
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 overflow-hidden max-h-60 overflow-y-auto w-64 z-[9999]">
      {props.items.length ? (
        props.items.map((item: any, index: number) => (
          <button
            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
              index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
            key={index}
            onClick={() => props.command(item)}
          >
            <div className="font-semibold truncate">{item.title}</div>
            <div className="text-[10px] text-gray-500 truncate">{item.fileName}</div>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-gray-500 text-center">No PDFs found</div>
      )}
    </div>
  );
});

export const CitationExtension = Extension.create({
  name: 'citationSuggestion',
  
  addOptions() {
    return {
      suggestion: {
        char: '[[',
        pluginKey: CitationPluginKey,
        command: ({ editor, range, props }: any) => {
          // Increase range.to by 2 to account for the closing ]] if the user typed it,
          // but usually Suggestion only catches the prefix and the query.
          // Tiptap's suggestion automatically deletes the char and the query.
          editor
            .chain()
            .focus()
            .insertContentAt(range, `[[${props.id}|${props.title}]] `)
            .run();
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }) => {
          return MOCK_MATERIALS.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) || 
            item.fileName.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5);
        },
        render: () => {
          let component: ReactRenderer;
          let popup: TippyInstance[];

          return {
            onStart: (props) => {
              component = new ReactRenderer(CitationList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as any,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },

            onUpdate(props) {
              component.updateProps(props);
              if (!props.clientRect) return;
              popup[0].setProps({
                getReferenceClientRect: props.clientRect as any,
              });
            },

            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }
              return (component.ref as any)?.onKeyDown(props);
            },

            onExit() {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      }),
      // Fallback trigger /cite
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        pluginKey: new PluginKey('citationSuggestionFallback'),
        char: '/cite',
        items: ({ query }) => {
          return MOCK_MATERIALS.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) || 
            item.fileName.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5);
        },
        render: () => {
          let component: ReactRenderer;
          let popup: TippyInstance[];

          return {
            onStart: (props) => {
              component = new ReactRenderer(CitationList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as any,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },

            onUpdate(props) {
              component.updateProps(props);
              if (!props.clientRect) return;
              popup[0].setProps({
                getReferenceClientRect: props.clientRect as any,
              });
            },

            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }
              return (component.ref as any)?.onKeyDown(props);
            },

            onExit() {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});
