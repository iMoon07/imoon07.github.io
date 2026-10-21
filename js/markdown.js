/* =============================================================================
   EXTENSION MARKDOWN / MARKDOWN EXTENSIONS
   Syntax yang tidak ada di GFM: footnote, sub/sup, highlight, definition list,
   math, dan mermaid. Semuanya dipasang sebagai extension marked.
   Syntax that GFM does not have: footnotes, sub/sup, highlight, definition
   lists, math, and mermaid. All of them are registered as marked extensions.

   State direset sebelum tiap artikel dirender, supaya footnote tidak menumpuk
   antar artikel.
   State is reset before every article render so footnotes never pile up
   between articles.
   ============================================================================= */

(function () {
    if (typeof marked === 'undefined') return;

    const state = {
        footnotes: new Map(),
        order: []
    };

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /* -------------------------------------------------------------- extensions
       Daftar extension marked: satu tokenizer dan renderer per sintaks.
       The marked extension list: one tokenizer and renderer per syntax. */

    marked.use({
        extensions: [
            /* Footnote reference: [^1]
               Rujukan footnote di dalam teks.
               Footnote reference inside the text. */
            {
                name: 'footnoteRef',
                level: 'inline',
                start(src) {
                    return src.indexOf('[^');
                },
                tokenizer(src) {
                    const match = /^\[\^([^\]\s]+)\]/.exec(src);
                    if (!match) return;
                    return { type: 'footnoteRef', raw: match[0], id: match[1] };
                },
                renderer(token) {
                    if (!state.order.includes(token.id)) state.order.push(token.id);
                    const number = state.order.indexOf(token.id) + 1;
                    return `<sup class="footnote-ref"><a href="#fn-${escapeHtml(token.id)}" id="fnref-${escapeHtml(token.id)}">${number}</a></sup>`;
                }
            },

            /* Superscript: x^2^
               Superscript: pangkat di atas baseline.
               Superscript: raised exponent. */
            {
                name: 'superscript',
                level: 'inline',
                start(src) {
                    return src.indexOf('^');
                },
                tokenizer(src) {
                    const match = /^\^(?=[^\^\s])([^\^\n]*?[^\^\s])\^(?!\^)/.exec(src);
                    if (!match) return;
                    return {
                        type: 'superscript',
                        raw: match[0],
                        text: match[1],
                        tokens: this.lexer.inlineTokens(match[1])
                    };
                },
                renderer(token) {
                    return `<sup>${this.parser.parseInline(token.tokens)}</sup>`;
                }
            },

            /* Subscript: H~2~O
               Subscript: angka kecil di bawah baseline.
               Subscript: lowered index. */
            {
                name: 'subscript',
                level: 'inline',
                start(src) {
                    return src.indexOf('~');
                },
                tokenizer(src) {
                    const match = /^~(?=[^~\s])([^~\n]*?[^~\s])~(?!~)/.exec(src);
                    if (!match) return;
                    return {
                        type: 'subscript',
                        raw: match[0],
                        text: match[1],
                        tokens: this.lexer.inlineTokens(match[1])
                    };
                },
                renderer(token) {
                    return `<sub>${this.parser.parseInline(token.tokens)}</sub>`;
                }
            },

            /* Highlight: ==penting==
               Highlight: teks yang ditandai sorot.
               Highlight: marked emphasis. */
            {
                name: 'highlight',
                level: 'inline',
                start(src) {
                    return src.indexOf('==');
                },
                tokenizer(src) {
                    const match = /^==(?=[^\s=])([\s\S]*?[^\s=])==(?!=)/.exec(src);
                    if (!match) return;
                    return {
                        type: 'highlight',
                        raw: match[0],
                        text: match[1],
                        tokens: this.lexer.inlineTokens(match[1])
                    };
                },
                renderer(token) {
                    return `<mark>${this.parser.parseInline(token.tokens)}</mark>`;
                }
            },

            /* Block math: $ ... $
               Matematika blok, dirender KaTeX nanti.
               Block math, rendered by KaTeX later. */
            {
                name: 'mathBlock',
                level: 'block',
                start(src) {
                    return src.indexOf('$$');
                },
                tokenizer(src) {
                    const match = /^\$\$([\s\S]+?)\$\$(?:\n+|$)/.exec(src);
                    if (!match) return;
                    return { type: 'mathBlock', raw: match[0], text: match[1].trim() };
                },
                renderer(token) {
                    return `<div class="math-block" data-math="${escapeHtml(token.text)}">${escapeHtml(token.text)}</div>`;
                }
            },

            /* Footnote definition: [^1]: teks
               Definisi footnote, disimpan lalu dirakit di akhir.
               Footnote definition, stored and assembled at the end. */
            {
                name: 'footnoteDefinition',
                level: 'block',
                start(src) {
                    return src.indexOf('[^');
                },
                tokenizer(src) {
                    const lines = src.split('\n');
                    const match = /^\[\^([^\]\s]+)\]:[ \t]*(.*)$/.exec(lines[0]);
                    if (!match) return;

                    let text = match[2];
                    let used = 1;

                    while (used < lines.length && /^[ \t]+\S/.test(lines[used])) {
                        text += ` ${lines[used].trim()}`;
                        used++;
                    }

                    state.footnotes.set(match[1], text);
                    return { type: 'footnoteDefinition', raw: lines.slice(0, used).join('\n'), id: match[1] };
                },
                renderer() {
                    return '';
                }
            },

            /* Definition list: istilah / : penjelasan
               Daftar definisi: istilah lalu penjelasannya.
               Definition list: a term followed by its description. */
            {
                name: 'definitionList',
                level: 'block',
                start(src) {
                    const match = /^[^\n:][^\n]*\n:[ \t]+/m.exec(src);
                    return match ? match.index : undefined;
                },
                tokenizer(src) {
                    const lines = src.split('\n');
                    const items = [];
                    let index = 0;

                    while (index < lines.length) {
                        const term = lines[index].trim();

                        if (!term) break;
                        if (/^(:|#|>|-|\||`|\[|\d+\.)/.test(term)) break;

                        const definition = lines[index + 1];
                        if (!definition || !/^:[ \t]+\S/.test(definition)) break;

                        let text = definition.replace(/^:[ \t]+/, '');
                        index += 2;

                        while (index < lines.length && /^[ \t]+\S/.test(lines[index])) {
                            text += ` ${lines[index].trim()}`;
                            index++;
                        }

                        items.push({
                            term,
                            text,
                            termTokens: this.lexer.inlineTokens(term),
                            textTokens: this.lexer.inlineTokens(text)
                        });

                        if (index < lines.length && lines[index].trim() === '') index++;
                    }

                    if (!items.length) return;

                    return {
                        type: 'definitionList',
                        raw: lines.slice(0, index).join('\n'),
                        items
                    };
                },
                renderer(token) {
                    const body = token.items.map(item =>
                        `<dt>${this.parser.parseInline(item.termTokens)}</dt>` +
                        `<dd>${this.parser.parseInline(item.textTokens)}</dd>`
                    ).join('');

                    return `<dl class="definition-list">${body}</dl>`;
                }
            },

            /* Inline math: $E = mc^2$
               Matematika sebaris, dirender KaTeX nanti.
               Inline math, rendered by KaTeX later. */
            {
                name: 'mathInline',
                level: 'inline',
                start(src) {
                    return src.indexOf('$');
                },
                tokenizer(src) {
                    const match = /^\$(?!\s)((?:\\.|[^$\n\\])+?)(?<!\s)\$(?!\d)/.exec(src);
                    if (!match) return;
                    return { type: 'mathInline', raw: match[0], text: match[1] };
                },
                renderer(token) {
                    return `<span class="math-inline" data-math="${escapeHtml(token.text)}">${escapeHtml(token.text)}</span>`;
                }
            }
        ]
    });

    /* ---------------------------------------------------------------- helpers
       Helper untuk menyusun daftar footnote di akhir artikel.
       Helpers that build the footnote list at the end of the article. */

    function resetFootnotes() {
        state.footnotes.clear();
        state.order.length = 0;
    }

    // Daftar footnote ditambahkan setelah seluruh artikel ter-render
    // The footnote list is appended after the whole article is rendered
    function footnotesHtml() {
        if (!state.footnotes.size) return '';

        const ids = state.order.filter(id => state.footnotes.has(id));
        for (const id of state.footnotes.keys()) {
            if (!ids.includes(id)) ids.push(id);
        }

        if (!ids.length) return '';

        const items = ids.map((id, index) => {
            const text = marked.parseInline(state.footnotes.get(id));
            return `<li id="fn-${escapeHtml(id)}"><p>${text} ` +
                `<a class="footnote-backref" href="#fnref-${escapeHtml(id)}" aria-label="Kembali ke catatan ${index + 1}">↩</a></p></li>`;
        }).join('');

        return `<section class="footnotes" role="doc-endnotes">` +
            `<h2 class="footnotes-title">Footnotes</h2><ol>${items}</ol></section>`;
    }

    window.ArticleMarkdown = {
        reset: resetFootnotes,
        footnotesHtml,
        escapeHtml
    };
})();
