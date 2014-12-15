
var Content=function(options) {
  this.status="queue";
  this.url="";
  this.callback=null;
  this.type="json";
  this.tries=0;
  this.data=null;
  this.that=null;
  this.payload=null;

  if(options) {
    if("url" in options) this.url=options.url;
    if("callback" in options) this.callback=options.callback;
    if("type" in options) this.type=options.type;
    if("that" in options) this.that=options.that;
    if("payload" in options) this.payload=options.payload;
  }

  this.getJSON=function() {
//    log("Getting JSON file "+this.url+"...",LOG_DEBUG);
    var that=this;
    $.getJSON(that.url)
      .done(that.dl_done)
      .fail(that.dl_fail);
  };

  this.getString=function() {
//    log("Getting plain file "+this.url+"...",LOG_DEBUG);
    $.get(this.url)
      .done(this.dl_done)
      .fail(this.dl_fail);
  };

  this.getImage=function() {
//    log("Getting image "+this.url+"...",LOG_DEBUG);
    this.data=new Image(this.url);
    this.data.onload=function() {
      var that=get_queue_current(); // we better be in a queue
      if(!that) {
        log("OHSHITSHITSHIT!",LOG_FATAL);
        return;
      }
      that.dl_done(that.data);
    };
    this.data.onerror=function() {
      var that=get_queue_current(); // we better be in a queue
      if(!that) {
        log("OHSHITSHITSHIT!",LOG_FATAL);
        return;
      }
      that.dl_fail({status:"unknown error"},"unknown error");
    };
    this.data.src=this.url;
  };

  this.getAudio=function() {
//    log("Getting audio "+this.url+"...",LOG_DEBUG);
    this.data=new Audio(this.url);
    this.dl_done(this.data);
  };

  this.dl_done=function(data) {
    var that=get_queue_current(); // we better be in a queue
    if(!that) {
      log("OHSHITSHITSHIT!",LOG_FATAL);
      return;
    }
    that.status="done";
//    log("Downloaded "+that.url,LOG_DEBUG);
    if(that.callback)
      that.callback.call(that.that,"ok",data,that.payload);
    load_item_done();
    get_queue_check();
    async_loaded("get");
  };

  this.dl_fail=function(d,error) {
    var that=get_queue_current(); // we better be in a queue
    if(!that) {
      log("OHSHITSHITSHIT!",LOG_FATAL);
      return;
    }
    var retry=true;
    log("Failed to get "+that.url+": "+d.status,LOG_WARNING)
    if(that.tries > prop.get.retry.max) {
      if(that.callback)
        that.callback.call(that.that,"fail",data,that.payload);
      that.status="fail";
      get_queue_check();
      load_item_done();
      async_loaded("get");
    } else {
      setTimeout(function() {
        that.get(); // try again
      },prop.get.retry.time);
    }
  };

  this.get=function() {
    async("get");
    this.tries+=1;
    var that=this;
    this.status="download";
    prop.load.message = this.url;
    setTimeout(function() {
      if(that.type == "json")
        that.getJSON();
      else if(that.type == "string")
        that.getString();
      else if(that.type == "image")
        that.getImage();
      else if(that.type == "audio")
        that.getAudio();
    },0);
  };

  load_item_add();
  get_queue_add(this);
};

function get_init_pre() {
  prop.get={};
  prop.get.queue=[];

  prop.get.retry={};
  prop.get.retry.max=120; // maximum number of retries
  prop.get.retry.time=5000; // retry every five seconds

  prop.get.current=-1;
}

function get_queue_current() {
  if(prop.get.current >= 0 && prop.get.current < prop.get.queue.length)
    return prop.get.queue[prop.get.current];
  return null;
}

function get_queue_check() {
  var current=get_queue_current();
  if((current && (current.status == "done" || current.status == "queue")) || !current) {
    prop.get.current+=1;
    current=get_queue_current();
    if(current)
      current.get();
    else
      log("Downloaded all assets.");
  }
}

function get_queue_add(content) {
  prop.get.queue.push(content);
  get_queue_check();
}
