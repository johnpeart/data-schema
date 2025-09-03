// govspeak.js
// Plugin to add GovSpeak extensions to markdown-it

function govSpeakPlugin(md) {
  // Helper function to create block rules for wrapped content
  function createWrappedBlockRule(name, startRegex, endRegex, renderOpen, renderClose) {
    const openRuleName = `${name}_open`;
    const closeRuleName = `${name}_close`;
    
    // Rule for opening tag
    md.block.ruler.before('paragraph', openRuleName, function(state, startLine, endLine, silent) {
      const pos = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      const line = state.src.slice(pos, max);
      
      const match = line.match(startRegex);
      if (!match) return false;
      
      if (silent) return true;
      
      // Find the closing tag
      let nextLine = startLine + 1;
      let found = false;
      
      while (nextLine < endLine) {
      const nextPos = state.bMarks[nextLine] + state.tShift[nextLine];
      const nextMax = state.eMarks[nextLine];
      const nextLineContent = state.src.slice(nextPos, nextMax);
      
      if (nextLineContent.match(endRegex)) {
        found = true;
        break;
      }
      nextLine++;
      }
      
      if (!found) return false;
      
      // Create opening token
      const openToken = state.push(openRuleName, 'div', 1);
      openToken.markup = match[0];
      openToken.map = [startLine, startLine + 1];
      
      // Process content between tags
      const contentLines = [];
      for (let i = startLine + 1; i < nextLine; i++) {
      const contentPos = state.bMarks[i] + state.tShift[i];
      const contentMax = state.eMarks[i];
      contentLines.push(state.src.slice(contentPos, contentMax));
      }
      
      if (contentLines.length > 0) {
      const contentToken = state.push('paragraph_open', 'p', 1);
      const inlineToken = state.push('inline', '', 0);
      inlineToken.content = contentLines.join('\n');
      inlineToken.map = [startLine + 1, nextLine];
      inlineToken.children = [];
      state.push('paragraph_close', 'p', -1);
      }
      
      // Create closing token
      const closeToken = state.push(closeRuleName, 'div', -1);
      closeToken.markup = endRegex;
      closeToken.map = [nextLine, nextLine + 1];
      
      state.line = nextLine + 1;
      return true;
    });
    
    md.renderer.rules[openRuleName] = renderOpen;
    md.renderer.rules[closeRuleName] = renderClose;
  }

  // Helper function to create single-line block rules (for backward compatibility)
  function createBlockRule(name, regex, render) {
    md.block.ruler.before('paragraph', name, function(state, startLine, endLine, silent) {
      const pos = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      const line = state.src.slice(pos, max);
      
      const match = line.match(regex);
      if (!match) return false;
      
      if (silent) return true;
      
      const token = state.push(name, 'div', 0);
      token.content = match[1] || match[0];
      token.map = [startLine, startLine + 1];
      
      state.line = startLine + 1;
      return true;
    });
    
    md.renderer.rules[name] = render;
  }

  // Helper function for inline rules
  function createInlineRule(name, regex, render) {
    md.inline.ruler.before('text', name, function(state, silent) {
      const pos = state.pos;
      const max = state.posMax;
      const src = state.src.slice(pos, max);
      
      const match = src.match(regex);
      if (!match) return false;
      
      if (silent) return true;
      
      const token = state.push(name, '', 0);
      token.content = match[1] || match[0];
      
      state.pos += match[0].length;
      return true;
    });
    
    md.renderer.rules[name] = render;
  }

  // Define wrapped block components
  createWrappedBlockRule(
    'cta', 
    /^\s*\$CTA\s*$/, 
    /^\s*\$CTA\s*$/, 
    function() { return '<div class="call-to-action">'; }, 
    function() { return '</div>'; }
  );

  createWrappedBlockRule(
    'example', 
    /^\s*\$E\s*$/, 
    /^\s*\$E\s*$/, 
    function() { return '<div class="example">'; }, 
    function() { return '</div>'; }
  );

  createWrappedBlockRule(
    'contact', 
    /^\s*\$C\s*$/, 
    /^\s*\$C\s*$/, 
    function() { return '<div class="contact">'; }, 
    function() { return '</div>'; }
  );

  createWrappedBlockRule(
    'download', 
    /^\s*\$D\s*$/, 
    /^\s*\$D\s*$/, 
    function() { return '<div class="form-download">'; }, 
    function() { return '</div>'; }
  );

  createWrappedBlockRule(
    'address', 
    /^\s*\$A\s*$/, 
    /^\s*\$A\s*$/, 
    function() { return '<div class="address"><div class="adr org fn">'; }, 
    function() { return '</div></div>'; }
  );

  // Same-line wrapped blocks
  createBlockRule(
    'help', 
    /^\s*\^(.+)\^\s*$/, 
    function(tokens, idx) {
    const content = md.utils.escapeHtml(tokens[idx].content);
    return `<div class="application-notice help-notice" role="note" aria-label="Help">
              <p class="govuk-body">${content}</p>
            </div>`;
  });
  
  // Same-line wrapped blocks
  createBlockRule(
    'warning', 
    /^\s*%(.+)%\s*$/, 
    function(tokens, idx) {
    const content = md.utils.escapeHtml(tokens[idx].content);
    return `<div class="govuk-warning-text" role="note" aria-label="Information">
              <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
              <strong class="govuk-warning-text__text">
              <span class="govuk-visually-hidden">Warning</span>
              ${content}
              </strong>
            </div>`;
  });

  // Convert h1 elements to h2 elements and add GOV.UK classes
  
  // Helper function to add classes to tokens
  function addClassToToken(token, className) {
    const classIndex = token.attrIndex('class');
    if (classIndex < 0) {
      token.attrPush(['class', className]);
    } else {
      token.attrs[classIndex][1] += ` ${className}`;
    }
  }

  // Store default renderers
  const defaultHeadingOpenRender = md.renderer.rules.heading_open || function(tokens, idx, options, env, renderer) {
    return renderer.renderToken(tokens, idx, options);
  };
  
  const defaultHeadingCloseRender = md.renderer.rules.heading_close || function(tokens, idx, options, env, renderer) {
    return renderer.renderToken(tokens, idx, options);
  };

  // Override heading renderers
  md.renderer.rules.heading_open = function(tokens, idx, options, env, renderer) {
    const token = tokens[idx];
    
    // Convert h1 to h2 and add appropriate classes
    if (token.tag === 'h1') {
      token.tag = 'h2';
      addClassToToken(token, 'govuk-heading-l');
    } else if (token.tag === 'h2') {
      addClassToToken(token, 'govuk-heading-l');
    } else if (token.tag === 'h3') {
      addClassToToken(token, 'govuk-heading-m');
    } else if (token.tag === 'h4') {
      addClassToToken(token, 'govuk-heading-s');
    }
    
    return defaultHeadingOpenRender(tokens, idx, options, env, renderer);
  };

  md.renderer.rules.heading_close = function(tokens, idx, options, env, renderer) {
    const token = tokens[idx];
    if (token.tag === 'h1') {
      token.tag = 'h2';
    }
    return defaultHeadingCloseRender(tokens, idx, options, env, renderer);
  };

  // Override paragraph renderer
  md.renderer.rules.paragraph_open = function(tokens, idx, options, env, renderer) {
    const token = tokens[idx];
    addClassToToken(token, 'govuk-body');
    return renderer.renderToken(tokens, idx, options);
  };

  // Override blockquote renderer
  md.renderer.rules.blockquote_open = function(tokens, idx, options, env, renderer) {
    const token = tokens[idx];
    addClassToToken(token, 'govuk-inset-text');
    return renderer.renderToken(tokens, idx, options);
  };

  // Override list renderers
  md.renderer.rules.bullet_list_open = function(tokens, idx, options, env, renderer) {
    const token = tokens[idx];
    addClassToToken(token, 'govuk-list govuk-list--bullet');
    return renderer.renderToken(tokens, idx, options);
  };

  md.renderer.rules.ordered_list_open = function(tokens, idx, options, env, renderer) {
    const token = tokens[idx];
    addClassToToken(token, 'govuk-list govuk-list--number');
    return renderer.renderToken(tokens, idx, options);
  };

  // Override hr renderer
  md.renderer.rules.hr = function(tokens, idx, options, env, renderer) {
    return '<hr class="govuk-section-break govuk-section-break--l govuk-section-break--visible">\n';
  };

  // Override table renderers
  md.renderer.rules.table_open = function(tokens, idx, options, env, renderer) {
    const token = tokens[idx];
    addClassToToken(token, 'govuk-table');
    return renderer.renderToken(tokens, idx, options);
  };

  md.renderer.rules.thead_open = function(tokens, idx, options, env, renderer) {
    const token = tokens[idx];
    addClassToToken(token, 'govuk-table__head');
    return renderer.renderToken(tokens, idx, options);
  };

  md.renderer.rules.tr_open = function(tokens, idx, options, env, renderer) {
    const token = tokens[idx];
    addClassToToken(token, 'govuk-table__row');
    return renderer.renderToken(tokens, idx, options);
  };

  md.renderer.rules.th_open = function(tokens, idx, options, env, renderer) {
    const token = tokens[idx];
    addClassToToken(token, 'govuk-table__header');
    return renderer.renderToken(tokens, idx, options);
  };

  md.renderer.rules.td_open = function(tokens, idx, options, env, renderer) {
    const token = tokens[idx];
    addClassToToken(token, 'govuk-table__cell');
    return renderer.renderToken(tokens, idx, options);
  };

  // Override link renderer to add govuk-link class
  const defaultLinkOpenRender = md.renderer.rules.link_open || function(tokens, idx, options, env, renderer) {
    return renderer.renderToken(tokens, idx, options);
  };

  md.renderer.rules.link_open = function(tokens, idx, options, env, renderer) {
    const token = tokens[idx];
    addClassToToken(token, 'govuk-link');
    return defaultLinkOpenRender(tokens, idx, options, env, renderer);
  };
  
  return md;
}

module.exports = govSpeakPlugin;