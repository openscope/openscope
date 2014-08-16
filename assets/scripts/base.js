
var Position=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};

      this.position = [0, 0];

      this.parse(options);

    },
    parse: function(data) {
//      if(data.position) this.position = data.position;
    },
  };
});
