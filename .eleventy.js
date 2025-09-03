// Markdown processing
const markdownIt = require('markdown-it');
const markdownItAnchor = require("markdown-it-anchor");
const govSpeakPlugin = require('./govspeak');


module.exports = function(eleventyConfig) {
  // Configure markdown-it with GovSpeak extensions
  const markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true
  }).use(markdownItAnchor, {
    // no permalink, just IDs
  });

  // Add GovSpeak plugin
  markdownLibrary.use(govSpeakPlugin);
  
  // Set the library
  eleventyConfig.setLibrary('md', markdownLibrary);

  // Filter to process GovSpeak in templates
  eleventyConfig.addFilter('govspeak', function(content) {
    return markdownLibrary.render(content);
  });
  
  // Shortcode for inline GovSpeak
  eleventyConfig.addShortcode('govspeak', function(content) {
    return markdownLibrary.render(content);
  });
  
  // Custom TOC filter
  // Updated TOC filter to parse HTML headings
  eleventyConfig.addFilter("toc", function(content) {
    if (!content) return [];    
    // More comprehensive regex that handles:
    // - Anchor links inside headings
    // - Multi-line content
    // - Various attributes
    const headingRegex = /<h([1-6])(?:\s[^>]*)?>(.+?)<\/h[1-6]>/gis;
    const headings = [];
    let match;
  
    while ((match = headingRegex.exec(content)) !== null) {
      const level = parseInt(match[1]);
      
      // Extract text content, removing any nested HTML tags (like anchor links)
      let text = match[2]
        .replace(/<a[^>]*>.*?<\/a>/gi, '') // Remove anchor links
        .replace(/<[^>]*>/g, '') // Remove any other HTML tags
        .trim();
      
      if (text) {
        const slug = text.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        
        headings.push({
          level: level,
          text: text,
          slug: slug
        });
      }
    }
    
    return headings;
  });

  // Passthrough Copies
  eleventyConfig.addPassthroughCopy('./src/assets');
  eleventyConfig.addPassthroughCopy('./src/javascripts');
  eleventyConfig.addPassthroughCopy('./src/stylesheets');
  
  // Collectionsa
  eleventyConfig.addCollection('pages', function(collectionApi) {
      return collectionApi.getFilteredByGlob('src/pages/**/*.md');
  });

  return {
      markdownTemplateEngine: 'liquid',
      htmlTemplateEngine: 'liquid',
      dataTemplateEngine: 'liquid',
      templateFormats: ['md', 'liquid', 'html'],
      dir: {
          input: 'src',
          includes: '../_includes',
          layouts: '../_layouts',
          data: '../_data',
          output: '_site'
      },
  };
};
