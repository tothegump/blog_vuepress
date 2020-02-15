// module.exports = {
//     title: 'Hello VuePress',
//     description: 'Just playing around'
//   }
module.exports = {
  title: 'Stupid is as stupid does', // Title for the site. This will be displayed in the navbar.
  theme: '@vuepress/theme-blog',
  themeConfig: {
    // Please keep looking down to see the available options.
    dateFormat: 'YYYY-MM-DD',
    nav: [
      {
        text: '文章',
        link: '/',
      },
      {
        text: 'ARTS',
        link: '/arts/',
      },
      {
        text: 'Tags',
        link: '/tag/',
      },
    ],
    footer: {
      contact: [
        {
          type: 'github',
          link: 'https://github.com/tothegump',
        },
      ],
      // copyright: [
      //   {
      //     text: 'MIT Licensed | Copyright © 2018-present tothegump',
      //     link: '',
      //   },
      // ]
    },
    directories: [
      {
        id: 'post',
        dirname: '_posts',
        path: '/',
        title: '文章',
      },
      {
        id: 'arts',
        dirname: '_arts',
        path: '/arts/',
        title: 'ARTS',
        
      },
    ],
    globalPagination: {
      lengthPerPage:'5', // Maximum number of posts per page.
      layout:'Pagination', // Layout for pagination page
    },
    sitemap: {
      hostname: 'http://blog.tothegump.com/'
    }
  }
}
