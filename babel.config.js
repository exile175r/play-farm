module.exports = function (api) {
  api.cache(true);
  return {
    plugins: [
      ['babel-plugin-react-compiler', {
        // React Compiler 옵션
        // 환경 변수로 제어할 수도 있습니다
      }],
    ],
  };
};

