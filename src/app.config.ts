export default defineAppConfig({
  pages: [
    'pages/practice/index',
    'pages/challenge/index',
    'pages/wrongbook/index',
    'pages/report/index',
    'pages/mine/index',
    'pages/plan/index',
    'pages/parent/index',
    'pages/reward/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF7A45',
    navigationBarTitleText: '口算小达人',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#FF7A45',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/practice/index',
        text: '练习'
      },
      {
        pagePath: 'pages/challenge/index',
        text: '闯关'
      },
      {
        pagePath: 'pages/wrongbook/index',
        text: '错题'
      },
      {
        pagePath: 'pages/report/index',
        text: '报告'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
