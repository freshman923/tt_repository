/**********************************欢迎使用我的头像裁剪器************************************

--首先来看使用方法:
  1.首先本插件依赖于jquery和bootstrap,因此，请将此插件放在前两项之后引入页面
  2.此次插件只能将图片裁剪成正方形，因此通常是作为头像的裁剪工具
  3.使用方法:
    (请在jquery加载完成之后，调用函数start_img_clipper)
    此函数只有一个参数,是一个参数对象,此对象中有6个属性,如下:
    @img_url                   这个参数代表了裁剪图片的url地址(字符串),如果你没有图片的url，只有File 对象、Blob 对象类型的图片，则可以使用URL.createObjectURL函数转化后再赋值
    @clipped_img_type          这个参数代表了裁剪图片后返回的图片数据类型，可以是：
                               "blob"或"dataurl"分别代表了blob对象类型的图片和base64数据类型的图片
                               如果想要图片的url地址则可以先将图片转化为blob对象,然后再使用URL.createObjectURL函数转化为url
    @load_complete_callback    这个属性代表了图片裁剪器加载完成的回调函数
    @img_load_error_callback   这个属性代表了用户选择的图片(有可能选择的不是图片,导致加载失败)加载失败后的回调函数
    @click_cancel_callback     这个属性代表了用户点击了取消按钮后的回调函数
    @click_confirm_callback    这个属性代表了用户点击确认按钮,并且裁剪完成之后的回调函数,要注意此回调函数的第一个参数默认传入裁剪后图片的数据,
                               可能为"blob"或"dataurl"数据类型的图片,具体是哪个取决于你之前填写的@clipped_img_type属性
                               
  4.来看具体使用例子:(仍然要强调: 请在jquery加载完成之后，调用函数start_img_clipper)
     start_img_clipper({
            img_url:img_blob_url,
            clipped_img_type:"blob",
            load_complete_callback:function(){
               //alert("图片裁剪器加载完成");
            },
            img_load_error_callback:function(){
                //alert("用户选择的图片加载失败");
            },
            click_cancel_callback:function(){
                //alert("用户点击了取消按钮");
            },
            click_confirm_callback:function(img_data){
                //alert("裁剪完成");
                
                console.log(img_data);
               
            }
        });
                        



***************************************************************************************/


function createNewCanvas(width,height){
        
        
        //创建一个canvas对象(由于canvas是一个标签,所以这里用createElement创建)
            var newCanvas=document.createElement('canvas');
        //获得 2d 上下文对象(也可以传入3d但这个项目用不到)
            var newCanvasContent=newCanvas.getContext('2d');
            
        //指定canvas画布的宽高(由于canvas是一个dom,所以直接用添加style的形式添加宽高即可)
            newCanvas.width = width;
            newCanvas.height = height;
        //创建一个对象来保存创建好的新的canvas对象,及其对应的2d 上下文对象
        var newCanvas_obj ={            
            c: newCanvas,
            ctx: newCanvasContent
        };
        
        
        //返回创建的新对象
        return newCanvas_obj;
//createNewCanvas函数结束的大括号
};





    
function destory_img_clipper(){
     //让之前创建的hammer.js实例对象（window.hammertime）销毁，让其所有事件失效
     window.hammertime.destroy();
     window.hammertime=null;
     //console.log(window.hammertime);
     
     //解除之前绑定的返回和确认按钮的点击事件
     $(".confirm_a").off("click");
     $(".cancel_a").off("click");
         
     //清除所有图片裁剪器插入的HTML和CSS代码
     $(".img_clipper_html_code").remove();
     $(".img_clipper_css_code").remove();
     //之后清除所有图片裁剪器创建的全局变量
     window.OG_img_canvas=null;
     window.scale_width=null;
     window.scale_height=null;
     window.og_left=null;
     window.og_top=null;
     window.touchstart_width=null;
     window.touchstart_height=null;
     
    
     
     
     
//destory_img_clipper函数结束的大括号
}
    
    




    
function start_img_clipper(param_obj){
    
       
    /*-------------------------------------------------------------------------------
    判断用户是否已经引入了jquery，如果用户没有引用jquery,则给出提示
    ---------------------------------------------------------------------------------*/
    if(typeof jQuery == 'undefined'){
        console.log("%c%s","color:rgb(169,67,65);background-color:rgb(242,222,223);border:1px solid rgb(234,205,209);font-weight:500;border-radius:5px;","这是来自图片裁剪器的错误提示:检测到页面中没有引入jquery,本插件依赖于jquery和bootstrap,请引入后重试");
        return false;
    }
    
   /*-------------------------------------------------------------------------------
    判断用户是否已经引入了hammer.js，如果用户没有引用hammer.js,那么我来帮他引入
    -------------------------------------------------------------------------------------*/
    
    if(typeof Hammer=="undefined"){
        //如果用户没有引用hammer.js,那么我来帮他引入
        console.log("用户没有引入hammer.js,我来帮忙引入");
        add_hammer_js();
    }else{
        console.log("用户已经引入了hammer.js");
    }
    
   /*-------------------------------------------------------------------------------
    下面这张图片的创建和加载，只是为了检测图片能否成功加载，如果能再执行下面的代码
    如果不能，则输出提示，并停止函数执行
    --------------------------------------------------------------*/    
    var test_whether_can_load_image = document.createElement('img');
    test_whether_can_load_image.src = param_obj.img_url;
    //这里如果用户选择的图片无法加载,则给出提示后停止后面程序的执行
    test_whether_can_load_image.onerror = function(){
        console.log("用户选择的图片加载失败😞");
        param_obj.img_load_error_callback();
    };
    test_whether_can_load_image.onload = function(){
        console.log("用户选择的图片加载成功😁");
    
    
    /*-------------------------------------------------------------------------------
    开始动态添加裁剪器所需要的html标签(直接插入到body标签的最后,由于裁剪器是position:fixed因此不会影响到body内其他标签)
    --------------------------------------------------------------*/
    
    var body=document.getElementsByTagName('body')[0];
    var div=document.createElement('div');
    $(div).addClass("img_clipper_html_code");
        div.innerHTML=
    '<div class="img_clipper floor1_black_div" style="background-color:#333;width:100vw;height:100vh;overflow:hidden;position:fixed;top:0px;left:-100vw;z-index:9998;">'+
      //下面这个container是上面确认和取消的栅格系统。
      '<div class="check_bar container" style="position:absolute;top:0px;left:0px;width:100%;height:8vh;z-index:999;">'+
        '<div class="row" style="height:100%;">'+
         '<div class="col-xs-3" style="height:100%;">'+
          '<a class="cancel_a" href="JavaScript:;">'+
             '<div class="row" style="height:100%;">'+
                '<div class="col-xs-5" style="height:100%;padding:0;position:relative;text-align:right;"><span style="font-size:20px;font-weight:600;color:White;display:inline-block;position:relative;top:50%;transform:translateY(-50%);" class="glyphicon glyphicon-menu-left" aria-hidden="true"></span></div>'+
                '<div class="col-xs-7" style="height:100%;padding:0;"><span style="font-size:20px;font-weight:700;color:White;display:inline-block;position:relative;top:50%;transform:translateY(-50%);">返回</span></div>'+
             '</div>'+
          '</a>'+        
         '</div>'+
         '<div class="col-xs-6" style="height:100%;"></div>'+
         '<div class="col-xs-3" style="height:100%;">'+
          '<a class="confirm_a" href="JavaScript:;">'+
             '<div class="row" style="height:100%;">'+           
               '<div class="col-xs-7" style="height:100%;padding:0;text-align:right;"><span style="font-size:20px;font-weight:700;color:White;display:inline-block;position:relative;top:50%;transform:translateY(-50%);">确认</span></div>'+
               '<div class="col-xs-5" style="height:100%;padding:3px;position:relative;"><span style="font-size:20px;font-weight:100;color:White;display:inline-block;position:relative;top:50%;transform:translateY(-50%);" class="glyphicon glyphicon-ok" aria-hidden="true"></span></div>'+
             '</div>'+  
          '</a>'+
         '</div>'+
        '</div>' +    
      '</div>'+
      //下面这个div是那个实际显示的图片所对应的父元素（样式为圆形）（图片根据此父元素定位）
      '<div class="seen_img_circle" style="background-color:brown;width:75vw;height:75vw;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div>'+
      /*
        floor2_div是那个中间掏了个洞的div(mask样式)
        floor3_circle_div是那个隐藏的图片所对应的父元素（样式为圆形）
      */
      '<div class="floor2_div" style="background-color:rgba(0,0,0,0.6);width:100vw;height:100vh;">'+
        '<div class="floor3_circle_div" style="opacity:0;background-color:Red;width:75vw;height:75vw;border-radius:50%;position:relative;top:50%;left:50%;transform:translate(-50%,-50%);"></div>'+
      '</div>'+
      //下面这个can_not_zoom_tips是放大到最大以后给出的提示框
      '<div class="can_not_zoom_tips" style="width:100vw;height:8vh;position:fixed;bottom:10vh;display:none;" state="hide">'+
        '<div style="background-color:rgba(217,237,246,0.7);border:1px solid rgba(192,230,239,0.7);height:100%;width:60vw;margin:0 auto;border-radius:40px;text-align:center;">'+
          '<div style="position:relative;top:50%;transform:translateY(-50%);color:#386e88;">'+
            '<p style="margin:0;font-weight:800;">已放大到最大！</p>'+
            '<p style="margin:0;font-weight:500;">当前圆形区域为1px大小</p>'+
          '</div>'+
        '</div>'+    
      '</div>'+
     //这个是最外层img_clipper结束的div
    '</div>';
    body.appendChild(div); 
        
        
     /*-------------------------------------------------------------------------------
    开始动态添加裁剪器所需要的css样式(用一个style标签插入到head标签中)
    --------------------------------------------------------------*/
    
    var head=document.getElementsByTagName('head')[0];
    var style=document.createElement('style');
    $(style).addClass("img_clipper_css_code");
        style.innerHTML='.floor2_div{'+
                        '-webkit-mask-image: radial-gradient(circle,transparent 135px,black 0%);'+
                        '}';
        head.appendChild(style);   
             
    
        
    
    
       /*-------------------------------------------------------------------------------
       开始加载实际操作opacity:0的那张图片(实际的手指移动和缩放时间都监听这个图片)
       --------------------------------------------------------------*/
    
        var hide_image = document.createElement('img');
        hide_image.src = param_obj.img_url;
        $(hide_image).addClass("hide_image");
        $(".floor3_circle_div").append($(hide_image));  
           
        hide_image.onload = function(){
            
            //获取原图宽高。
            var OG_height = $(this).height();
            var OG_width = $(this).width();
            
            
            //给原图片创建canvas画布
            window.OG_img_canvas = createNewCanvas(OG_width,OG_height); 
            window.OG_img_canvas.ctx.drawImage(this,0,0,OG_width,OG_height);
            
            
            
        if(this.width>=this.height){        
            //图片宽大于高,将圆圈的直径设为图片高
                    
            this.height=$(".floor3_circle_div").width();    
            /*
              $(this).width()/2为图片中心点所对应圆圈左上角的left值
              $(".floor3_div").width()/2为圆圈的中点对应圆圈左上角的left值
              $(this).width()/2-$(".floor3_div").width()/2及为让图片中点和圆圈中点重合需要给图片设置的left值         
            */
            $(this).css({
            "position":"relative",
            "left":Math.round(($(".floor3_circle_div").width()/2)-($(this).width()/2))+"px",
            "opacity":"0.7"
            });
            
        }else{
             //图片宽小于高,将宽设为圆圈的直径
            
            this.width=$(".floor3_circle_div").width();
            /*
              $(this).height()/2为图片中心点所对应圆圈左上角的top值
              $(".floor3_div").height()/2为圆圈的中点对应圆圈左上角的top值
              $(this).height()/2-$(".floor3_div").height()/2及为让图片中点和圆圈中点重合需要给图片设置的top值        
            */
            $(this).css({
            "position":"relative",  
            "top":Math.round(($(".floor3_circle_div").height()/2)-($(this).height()/2))+"px",           
            "opacity":"0.7",
            });
                
            
        }
        
            
        
        
        
        
            
            
            // 获取首次缩放后(为了让图片和圆圈的大小相适应)图片宽高
            window.scale_width = $(this).width();
            window.scale_height = $(this).height();
            
            /*
            console.log("原来宽度"+OG_width);
            console.log("原来高度"+OG_height);
            console.log("现在宽度"+scale_width);
            console.log("现在高度"+scale_height);       
            */
            
    
            
            /*-------------------------------------------------------------------------------
            在隐藏的那张图片加载完成后，启动hammer.js
            --------------------------------------------------------------*/
    
            window.hammertime = new Hammer($(".hide_image")[0]);
            //将hammer.js的缩放事件启动，默认是关着的
            hammertime.get('pinch').set({ enable: true });
            
            /*-------------------------------------------------------------------------------
            监听手指缩放开始事件（pinchstart）
            --------------------------------------------------------------*/
    
            hammertime.on("pinchstart", function(ev) {
                console.log("pinchstart");
                
                /*
                  下面这段代码是hammer.js自带的用来暂停对手指移动事件监听的代码
                  这段代码在程序中不需要，但在调试手指缩放事件时，
                  可以调用这段代码来屏蔽手指移动事件对缩放事件的影响    
                 
                hammertime.get('pan').set({ enable: false });
                */
                
                window.og_left=Math.round(parseFloat($(ev.target).css("left")));
                window.og_top=Math.round(parseFloat($(ev.target).css("top")));
                console.log("点击时的left="+window.og_left);
                console.log("点击时的top="+window.og_top);
                window.touchstart_width=Math.round(parseFloat($(ev.target).width()));
                window.touchstart_height=Math.round(parseFloat($(ev.target).height()));
                console.log("点击时的图片width="+window.touchstart_width);
                
                
            });
            /*-------------------------------------------------------------------------------
            监听手指缩放移动事件（pinchmove）
            --------------------------------------------------------------*/
    
            hammertime.on('pinchmove', function(ev) {
                console.log(ev);
            
                        
                //首先获取(在此次缩放之前,前一次缩放后)图片的宽度和高度
                var current_width=Math.round(parseFloat($(ev.target).width()));
                var current_height=Math.round(parseFloat($(ev.target).height()));
                
                
                 //然后获取(在此次缩放之后)图片的宽度和高度
                var gonna_be_width=Math.round(parseFloat(window.touchstart_width*ev.scale));
                var gonna_be_height=Math.round(parseFloat(window.touchstart_height*ev.scale));
                
                               
                 //这四个变量分别代表图片缩放时，是否碰到了圆圈的上下左右边
                var LR_L_limited=0;//圆圈左边
                var LR_R_limited=0;//圆圈右边
                var TB_T_limited=0;//圆圈上边
                var TB_B_limited=0;//圆圈下边
                
                
                //首先获取图片四个边(在此次缩放之前)相对于圆圈左上角的位置
                var img_LS_left_current=Math.round(parseFloat($(ev.target).css("left")));//左边
                var img_RS_left_current=Math.round(parseFloat($(ev.target).css("left"))+current_width);//右边
                var img_TS_top_current=Math.round(parseFloat($(ev.target).css("top")));//上边
                var img_BS_top_current=Math.round(parseFloat($(ev.target).css("top"))+current_height);//下边
                
                
                
                
                //首先获取图片四个边(在此次缩放后)相对于圆圈左上角的位置
                var img_LS_left=Math.round(parseFloat($(ev.target).css("left")));//左边
                var img_RS_left=Math.round(parseFloat($(ev.target).css("left"))+gonna_be_width);//右边
                var img_TS_top=Math.round(parseFloat($(ev.target).css("top")));//上边
                var img_BS_top=Math.round(parseFloat($(ev.target).css("top"))+gonna_be_height);//下边
                
                //console.log("图片四个边位置:"+img_LS_left+"/"+img_RS_left+"/"+img_TS_top+"/"+img_BS_top);
                
                //然后获取圆圈四个边相对于圆圈左上角的位置
                var cir_LS_left=0;//左边
                var cir_RS_left=0+$(".floor3_circle_div").width();//右边
                var cir_TS_top=0;//上边
                var cir_BS_top=0+$(".floor3_circle_div").height();//下边
                
                
                     
                
                 
                
                
                
                
            if(ev.additionalEvent==="pinchout"){
                    console.log("放大"+ev.scale+"倍"); 
                    
                    
                 /******************************下面对图片放大倍数做限制*********************************/
                 
                 /*
                   之所以要对图片放大的倍数做限制，是由于如果让其无限放大，就会让left值不断变大,
                   然而js对number类型的数据有一条限制:
                   突破正数21位和负数7位的Number自动转换为科学计数法,
                   eg. 6.78E27  6.78E+27
                   然而，科学计数法本质是字符串这样的直传给left是无法识别的,因此，如果放大到一定程度，就会导致程序报错因此要对图片放大的倍数做限制
                   
                   而我下面做的限制是让图片最大只能放大到在圆圈中显示原图片1px大小的内容。
                  */
                    
                    
                    
                    /*然后获取最初图片的宽高(最初的没有见过任何缩放的原文件的宽高)*/                 
                    var OG_img_width=Math.round(parseFloat($(window.OG_img_canvas.c).attr("width")));
                    var OG_img_height=Math.round(parseFloat($(window.OG_img_canvas.c).attr("height")));
            
                    if( current_width>=(OG_img_width*$(".floor3_circle_div").width()) ){
                        console.log("已经放大到最大");
                        gonna_be_width=(OG_img_width*$(".floor3_circle_div").width());
                        gonna_be_height=(OG_img_height*$(".floor3_circle_div").height());
                       
                      //下面的if判断放大到最大以后给出的提示框是否已经出现,如果已经出现，就不再执行下面的代码,不然多次出现动画会让程序混乱
                      if( $(".can_not_zoom_tips").attr("state")!="show" ){
                        $(".can_not_zoom_tips").attr("state","show");
                        $(".can_not_zoom_tips").show();
                        $(".can_not_zoom_tips").animate({"bottom":"8vh"},100,function(){
                            $(this).animate({"bottom":"10vh"},100,function(){
                                //alert("执行完毕");
                                setTimeout(function(){
                                    $(".can_not_zoom_tips").hide();
                                    $(".can_not_zoom_tips").attr("state","hide");
                                },3000);
                            });
                        });
                      //判断当前提示是否出现的if结束的大括号 
                      }
                      
                    //判断是否放大到最大的if结束的大括号 
                    }
                    
                 /******************************对图片放大倍数做限制的代码到这里结束********************************/
                    
                    
                    
                    $(ev.target).width(gonna_be_width);
                    $(ev.target).height(gonna_be_height);
                     
                     /*
                       //(在此次缩放之前,前一次缩放后)圆圈中心相对于到图片左上角的left值和图片宽度的比值
                       (img_LS_left_current+$(".floor3_div").height()/2)/current_width;
                        //因此(在此次缩放之后)圆圈中心相对于到图片左上角的left值=上面的值*在此次缩放之后图片的宽度
                     */
                     var sacle_before_left=Math.abs(img_LS_left_current)+($(".floor3_circle_div").width()/2);
                     var sacle_before_left_ratio=sacle_before_left/current_width;
                     var sacle_after_left=sacle_before_left_ratio*gonna_be_width;
                     var correct_to_center_val_X=img_LS_left_current-(sacle_after_left-sacle_before_left);
                    
                  
                     $(ev.target).css("left",Math.round(correct_to_center_val_X)+"px");
                     
                     
                     
                     /*                      
                        sacle_before_top//(在此次缩放之前,前一次缩放后)圆圈中心相对于图片左上角的top值
                        sacle_before_top_ratio//sacle_before_top和图片当前高度的比值
                        sacle_after_top//在此次缩放之后,圆圈中心相对于图片左上角的top值
                        correct_to_center_val_Y//最终对y轴的修正值
                     */
                     var sacle_before_top=Math.abs(img_TS_top_current)+($(".floor3_circle_div").height()/2);
                     var sacle_before_top_ratio=sacle_before_top/current_height;
                     var sacle_after_top=sacle_before_top_ratio*gonna_be_height;
                     var correct_to_center_val_Y=img_TS_top_current-(sacle_after_top-sacle_before_top);
                     
                  
                     $(ev.target).css("top",Math.round(correct_to_center_val_Y)+"px");
                     
                    
                    
                     
            }else if(ev.additionalEvent==="pinchin"){
                    console.log("缩小"+ev.scale+"倍");
                    
                if(img_LS_left_current>=cir_LS_left){
                     //alert("缩放碰到左边");
                        console.log("缩放碰到左边");
                        var LR_L_limited=1;
                        //$(ev.target).css("left","0px");
                        //$(ev.target).css("top",(window.og_top+ev.deltaY)+"px");
                       
                }if(img_RS_left_current<=cir_RS_left){
                    //alert("缩放碰到右边");
                        console.log("缩放碰到右边");
                        var LR_R_limited=1;
                        //$(ev.target).css("left",-($(ev.target).width()-$(".floor3_div").width())+"px");
                        //$(ev.target).css("top",(window.og_top+ev.deltaY)+"px");
                }if(img_TS_top_current>=cir_TS_top){
                    //alert("缩放碰到上边");
                        console.log("缩放碰到上边");
                        var TB_T_limited=1;
                        //$(ev.target).css("left",(window.og_left+ev.deltaX)+"px");
                        //$(ev.target).css("top","0px");
                }if(img_BS_top_current<=cir_BS_top){
                    //alert("缩放碰到下边");
                        console.log("缩放碰到下边");                              
                        var TB_B_limited=1;
                        //$(ev.target).css("left",(window.og_left+ev.deltaX)+"px");
                        //$(ev.target).css("top",-($(ev.target).height()-$(".floor3_div").height())+"px");
                }
                    
                var result=LR_L_limited+""+LR_R_limited+""+TB_T_limited+""+TB_B_limited;
                console.log(LR_L_limited+""+LR_R_limited+""+TB_T_limited+""+TB_B_limited);
                console.log("------------");
                
                
                switch (result){     
                
                    case  "1000"://左
                        /*
                          下面两个if判断如果图片将要缩放成的宽度和高度小于，最初设定的图片宽高，则将图片将要缩放成的宽度和高度设定为最初设定的图片宽高
                          这样可以防止，用户快速缩小图片时，引发的图片进入到圆圈内的事件
                        */
                        if( parseFloat(window.touchstart_width*ev.scale)<=window.scale_width ){gonna_be_width=window.scale_width;}
                        if( parseFloat(window.touchstart_height*ev.scale)<=window.scale_height ){gonna_be_height=window.scale_height;}
                
                    
                        $(ev.target).width(gonna_be_width);
                        $(ev.target).height(gonna_be_height);
                        $(ev.target).css("left","0px");
                        
                        //下面这四行代码就是为了计算correct_to_center_val_Y，这个值代表了每次缩放后，为了缩放之前图片中在圆圈中心的内容，在图片缩放之后仍然保持在圆圈中心，需要的top值 
                        var sacle_before_top=Math.abs(img_TS_top_current)+($(".floor3_circle_div").height()/2);
                        var sacle_before_top_ratio=sacle_before_top/current_height;
                        var sacle_after_top=sacle_before_top_ratio*gonna_be_height;
                        var correct_to_center_val_Y=img_TS_top_current-(sacle_after_top-sacle_before_top);                          
                          
                        /*
                          注意:下面这个if和if else的作用和仅接触下边case中的代码原理一样,
                          那个里面用注释做了详细解释,所以这里就不再解释了     
                        */
                        
                        if( Math.round(correct_to_center_val_Y) >= 0 ){
                            correct_to_center_val_Y=0;
                        }else if( Math.round(Math.abs(correct_to_center_val_Y-$(".floor3_circle_div").height())) >= gonna_be_height ){                          
                            var correction_val=img_TS_top_current+($(".floor3_circle_div").height()-(gonna_be_height-Math.abs(img_TS_top_current))); 
                            correct_to_center_val_Y=correction_val;
                        }
                        
                        
                        $(ev.target).css("top",Math.round(correct_to_center_val_Y)+"px");
                                            
                        break;          
                      
                    case  "0100"://右
                        /*
                          下面两个if判断如果图片将要缩放成的宽度和高度小于，最初设定的图片宽高，则将图片将要缩放成的宽度和高度设定为最初设定的图片宽高
                          这样可以防止，用户快速缩小图片时，引发的图片进入到圆圈内的事件
                        */
                        if( parseFloat(window.touchstart_width*ev.scale)<=window.scale_width ){gonna_be_width=window.scale_width;}
                        if( parseFloat(window.touchstart_height*ev.scale)<=window.scale_height ){gonna_be_height=window.scale_height;}
                
                       
                      
                        $(ev.target).width(gonna_be_width);
                        $(ev.target).height(gonna_be_height);
                    
                        
                        //下面的correction_val计算了，每一次缩放后，floor3_circle_div，而需要的left值
                        var correction_val=img_LS_left_current+($(".floor3_circle_div").width()-(gonna_be_width-Math.abs(img_LS_left_current)));
                        $(ev.target).css("left",Math.round(correction_val)+"px");
                       
                        //下面这四行代码就是为了计算correct_to_center_val_Y，这个值代表了每次缩放后，为了缩放之前图片中在圆圈中心的内容，在图片缩放之后仍然保持在圆圈中心，需要的top值                         
                        var sacle_before_top=Math.abs(img_TS_top_current)+($(".floor3_circle_div").height()/2);
                        var sacle_before_top_ratio=sacle_before_top/current_height;
                        var sacle_after_top=sacle_before_top_ratio*gonna_be_height;
                        var correct_to_center_val_Y=img_TS_top_current-(sacle_after_top-sacle_before_top);      
                        
                         
                        /*
                          注意:下面这个if和if else的作用和仅接触下边case中的代码原理一样,
                          那个里面用注释做了详细解释,所以这里就不再解释了     
                        */
                        
                        if( Math.round(correct_to_center_val_Y) >= 0 ){
                            correct_to_center_val_Y=0;
                        }else if( Math.round(Math.abs(correct_to_center_val_Y-$(".floor3_circle_div").height())) >= gonna_be_height ){                          
                            var correction_val=img_TS_top_current+($(".floor3_circle_div").height()-(gonna_be_height-Math.abs(img_TS_top_current))); 
                            correct_to_center_val_Y=correction_val;
                        }
                        
                        $(ev.target).css("top",Math.round(correct_to_center_val_Y)+"px");
                                            
              
                        break;
                       
                    case  "0010"://上
                        /*
                          下面两个if判断如果图片将要缩放成的宽度和高度小于，最初设定的图片宽高，则将图片将要缩放成的宽度和高度设定为最初设定的图片宽高
                          这样可以防止，用户快速缩小图片时，引发的图片进入到圆圈内的事件
                        */
                        if( parseFloat(window.touchstart_width*ev.scale)<=window.scale_width ){gonna_be_width=window.scale_width;}
                        if( parseFloat(window.touchstart_height*ev.scale)<=window.scale_height ){gonna_be_height=window.scale_height;}
                
                    
                        $(ev.target).width(gonna_be_width);
                        $(ev.target).height(gonna_be_height);
                        
                        $(ev.target).css("top","0px");
                        
                        //下面这四行代码就是为了计算correct_to_center_val_X，这个值代表了每次缩放后，为了缩放之前图片中在圆圈中心的内容，在图片缩放之后仍然保持在圆圈中心，需要的left值                         
                        var sacle_before_left=Math.abs(img_LS_left_current)+($(".floor3_circle_div").width()/2);
                        var sacle_before_left_ratio=sacle_before_left/current_width;
                        var sacle_after_left=sacle_before_left_ratio*gonna_be_width;
                        var correct_to_center_val_X=img_LS_left_current-(sacle_after_left-sacle_before_left);    
                        
                        /*
                          注意:下面这个if和if else的作用和仅接触下边case中的代码原理一样,
                          那个里面用注释做了详细解释,所以这里就不再解释了     
                        */
                        
                        if( Math.round(correct_to_center_val_X) >= 0 ){
                            correct_to_center_val_X=0;
                        }else if( Math.round(Math.abs(correct_to_center_val_X-$(".floor3_circle_div").width())) >= gonna_be_width ){                          
                            var correction_val=img_LS_left_current+($(".floor3_circle_div").width()-(gonna_be_width-Math.abs(img_LS_left_current)));
                            correct_to_center_val_X=correction_val;
                        }
                        
                                              
                        $(ev.target).css("left",Math.round(correct_to_center_val_X)+"px");
                     
                        break;
                        
                    case  "0001"://下    
                        /*
                          下面两个if判断如果图片将要缩放成的宽度和高度小于，最初设定的图片宽高，则将图片将要缩放成的宽度和高度设定为最初设定的图片宽高
                          这样可以防止，用户快速缩小图片时，引发的图片进入到圆圈内的事件
                        */
                        if( parseFloat(window.touchstart_width*ev.scale)<=window.scale_width ){gonna_be_width=window.scale_width;}
                        if( parseFloat(window.touchstart_height*ev.scale)<=window.scale_height ){gonna_be_height=window.scale_height;}
                
                                   
                        $(ev.target).width(gonna_be_width);
                        $(ev.target).height(gonna_be_height);
                     
                        //下面的correction_val计算了，每一次缩放后，为了让图片始终固定于圆圈底端，而需要的top值
                        var correction_val=img_TS_top_current+($(".floor3_circle_div").height()-(gonna_be_height-Math.abs(img_TS_top_current)));                       
                        $(ev.target).css("top",Math.round(correction_val)+"px");
                       
                        //下面这四行代码就是为了计算correct_to_center_val_X，这个值代表了每次缩放后，为了缩放之前图片中在圆圈中心的内容，在图片缩放之后仍然保持在圆圈中心，需要的left值                         
                        var sacle_before_left=Math.abs(img_LS_left_current)+($(".floor3_circle_div").width()/2);
                        var sacle_before_left_ratio=sacle_before_left/current_width;
                        var sacle_after_left=sacle_before_left_ratio*gonna_be_width;
                        var correct_to_center_val_X=img_LS_left_current-(sacle_after_left-sacle_before_left);     
                        
                      
                        /*
                          注意:下面这个if和if else用来排除
                          当此时圆圈下边和图片下边相接触时用户快速缩小，此时有三种情况
                          1.接下来图片会和圆圈的上边接触
                          2.接下来图片会和圆圈的右边接触
                          3.接下来图片会和圆圈的左边接触
                          在以上三种情况中,由于用户缩小速度非常快,因此，程序会先执行接触下边的情况，之后再触发相应的碰到左下或右下或上下事件，
                          但由于仅接触下边时，没有对接触其他边做出限制，因此有可能仅接触下边时，图片进入了圆圈中，然后再厂触发相应的碰到左下或右下或上下事件厂，
                          把图片拉出圆圈，这样就会造成闪动现象，用户体验很差
                          解决方案：
                          在仅接触下边时，就对可能接触的其他边做出限制，防止图片进入了圆圈中，方法及代码如下：
                          
                        */
                        
                        if( Math.round(correct_to_center_val_X) >= 0 ){
                            correct_to_center_val_X=0;
                        }else if( Math.round(Math.abs(correct_to_center_val_X-$(".floor3_circle_div").width())) >= gonna_be_width ){                          
                            var correction_val=img_LS_left_current+($(".floor3_circle_div").width()-(gonna_be_width-Math.abs(img_LS_left_current)));
                            correct_to_center_val_X=correction_val;
                        }
                        
                        
                        $(ev.target).css("left",Math.round(correct_to_center_val_X)+"px");
                     
                        break;
                        
                    
                    case  "0011"://上下
                        $(ev.target).width(window.scale_width);
                        $(ev.target).height(window.scale_height);
                        $(ev.target).css("top","0px");  
                        
                        break;
                    case  "0101"://右下
                        /*
                          下面两个if判断如果图片将要缩放成的宽度和高度小于，最初设定的图片宽高，则将图片将要缩放成的宽度和高度设定为最初设定的图片宽高
                          这样可以防止，用户快速缩小图片时，引发的图片进入到圆圈内的事件
                        */
                        if( parseFloat(window.touchstart_width*ev.scale)<=window.scale_width ){gonna_be_width=window.scale_width;}
                        if( parseFloat(window.touchstart_height*ev.scale)<=window.scale_height ){gonna_be_height=window.scale_height;}
               
                    
                        $(ev.target).width(gonna_be_width);
                        $(ev.target).height(gonna_be_height);
                        
                        
                        var correction_val=img_LS_left_current+($(".floor3_circle_div").width()-(gonna_be_width-Math.abs(img_LS_left_current)));
                        $(ev.target).css("left",Math.round(correction_val)+"px");
                        var correction_val=img_TS_top_current+($(".floor3_circle_div").height()-(gonna_be_height-Math.abs(img_TS_top_current))); 
                        $(ev.target).css("top",Math.round(correction_val)+"px");
                        break;
                    case  "1001"://左下
                        /*
                          下面两个if判断如果图片将要缩放成的宽度和高度小于，最初设定的图片宽高，则将图片将要缩放成的宽度和高度设定为最初设定的图片宽高
                          这样可以防止，用户快速缩小图片时，引发的图片进入到圆圈内的事件
                        */
                        if( parseFloat(window.touchstart_width*ev.scale)<=window.scale_width ){gonna_be_width=window.scale_width;}
                        if( parseFloat(window.touchstart_height*ev.scale)<=window.scale_height ){gonna_be_height=window.scale_height;}
                
                    
                        $(ev.target).width(gonna_be_width);
                        $(ev.target).height(gonna_be_height);
                        $(ev.target).css("left","0px");
                        var correction_val=img_TS_top_current+($(".floor3_circle_div").height()-(gonna_be_height-Math.abs(img_TS_top_current))); 
                        $(ev.target).css("top",Math.round(correction_val)+"px");
                        break;
                    case  "0110"://右上
                        /*
                          下面两个if判断如果图片将要缩放成的宽度和高度小于，最初设定的图片宽高，则将图片将要缩放成的宽度和高度设定为最初设定的图片宽高
                          这样可以防止，用户快速缩小图片时，引发的图片进入到圆圈内的事件
                        */
                        if( parseFloat(window.touchstart_width*ev.scale)<=window.scale_width ){gonna_be_width=window.scale_width;}
                        if( parseFloat(window.touchstart_height*ev.scale)<=window.scale_height ){gonna_be_height=window.scale_height;}
                
                        $(ev.target).width(gonna_be_width);
                        $(ev.target).height(gonna_be_height);
                        var correction_val=img_LS_left_current+($(".floor3_circle_div").width()-(gonna_be_width-Math.abs(img_LS_left_current)));
                        $(ev.target).css("left",Math.round(correction_val)+"px");
                        $(ev.target).css("top","0px");
                        break;
                    case  "1010"://左上
                        /*
                          下面两个if判断如果图片将要缩放成的宽度和高度小于，最初设定的图片宽高，则将图片将要缩放成的宽度和高度设定为最初设定的图片宽高
                          这样可以防止，用户快速缩小图片时，引发的图片进入到圆圈内的事件
                        */
                        if( parseFloat(window.touchstart_width*ev.scale)<=window.scale_width ){gonna_be_width=window.scale_width;}
                        if( parseFloat(window.touchstart_height*ev.scale)<=window.scale_height ){gonna_be_height=window.scale_height;}
                
                    
                        $(ev.target).width(gonna_be_width);
                        $(ev.target).height(gonna_be_height);
                        $(ev.target).css("left","0px");
                        $(ev.target).css("top","0px");
                        break;
                    case  "1100"://左右
                        $(ev.target).width(window.scale_width);
                        $(ev.target).height(window.scale_height);
                        $(ev.target).css("left","0px");
                       
                        break;
                        
                       
                    case  "0111"://右上下                 
                        $(ev.target).width(window.scale_width);
                        $(ev.target).height(window.scale_height);                       
                        $(ev.target).css("left",($(".floor3_circle_div").width()-window.scale_width)+"px");                                      
                        $(ev.target).css("top","0px");
                       
                        break;
                    case  "1011"://左上下
                        $(ev.target).width(window.scale_width);
                        $(ev.target).height(window.scale_height);
                        $(ev.target).css("left","0px");
                        $(ev.target).css("top","0px");
                        break;
                    case  "1101"://左右下
                        $(ev.target).width(window.scale_width);
                        $(ev.target).height(window.scale_height);
                        $(ev.target).css("left","0px");                        
                        $(ev.target).css("top",($(".floor3_circle_div").height()-window.scale_height)+"px");
                      
                       
                        break;
                    case  "1110"://左右上
                        $(ev.target).width(window.scale_width);
                        $(ev.target).height(window.scale_height);
                        $(ev.target).css("left","0px");
                        $(ev.target).css("top","0px");
                        break;
                        
                        
                        
                    case  "1111"://上下左右
                        $(ev.target).width(window.scale_width);
                        $(ev.target).height(window.scale_height);
                        $(ev.target).css("top","0px");
                        $(ev.target).css("left","0px");
                        break;                  
                        
                       
                    
                    case  "0000":
                     /*
                       下面两个if判断如果图片将要缩放成的宽度和高度小于，最初设定的图片宽高，则将图片将要缩放成的宽度和高度设定为最初设定的图片宽高
                       这样可以防止，用户快速缩小图片时，引发的图片进入到圆圈内的事件
                     */
                     if( parseFloat(window.touchstart_width*ev.scale)<=window.scale_width ){gonna_be_width=window.scale_width;}
                     if( parseFloat(window.touchstart_height*ev.scale)<=window.scale_height ){gonna_be_height=window.scale_height;}
                
                        
                     $(ev.target).width(gonna_be_width);
                     $(ev.target).height(gonna_be_height);
                     
                     /*
                       //(在此次缩放之前,前一次缩放后)圆圈中心相对于到图片左上角的left值和图片宽度的比值
                       (img_LS_left_current+$(".floor3_div").height()/2)/current_width;
                        //因此(在此次缩放之后)圆圈中心相对于到图片左上角的left值=上面的值*在此次缩放之后图片的宽度
                     */
                     var sacle_before_left=Math.abs(img_LS_left_current)+($(".floor3_circle_div").width()/2);
                     var sacle_before_left_ratio=sacle_before_left/current_width;
                     var sacle_after_left=sacle_before_left_ratio*gonna_be_width;
                     var correct_to_center_val_X=img_LS_left_current-(sacle_after_left-sacle_before_left);
                    
                        /*
                          注意:下面这个if和if else的作用和仅接触下边(case "0001")中的代码原理一样,
                          那个里面用注释做了详细解释,所以这里就不再解释了     
                        */
                        
                        if( Math.round(correct_to_center_val_X) >= 0 ){
                            correct_to_center_val_X=0;
                        }else if( Math.round(Math.abs(correct_to_center_val_X-$(".floor3_circle_div").width())) >= gonna_be_width ){                          
                            var correction_val=img_LS_left_current+($(".floor3_circle_div").width()-(gonna_be_width-Math.abs(img_LS_left_current)));
                            correct_to_center_val_X=correction_val;
                        }
                  
                     $(ev.target).css("left",Math.round(correct_to_center_val_X)+"px");
                     
                     
                     console.log("left="+$(ev.target).css("left"));
                     console.log("left="+ev.target.style.left);
                    
                     /*                      
                        sacle_before_top//(在此次缩放之前,前一次缩放后)圆圈中心相对于图片左上角的top值
                        sacle_before_top_ratio//sacle_before_top和图片当前高度的比值
                        sacle_after_top//在此次缩放之后,圆圈中心相对于图片左上角的top值
                        correct_to_center_val_Y//最终对y轴的修正值
                     */
                     var sacle_before_top=Math.abs(img_TS_top_current)+($(".floor3_circle_div").height()/2);
                     var sacle_before_top_ratio=sacle_before_top/current_height;
                     var sacle_after_top=sacle_before_top_ratio*gonna_be_height;
                     var correct_to_center_val_Y=img_TS_top_current-(sacle_after_top-sacle_before_top);
                     
                        /*
                          注意:下面这个if和if else的作用和仅接触下边(case "0001")中的代码原理一样,
                          那个里面用注释做了详细解释,所以这里就不再解释了     
                        */
                        
                        if( Math.round(correct_to_center_val_Y) >= 0 ){
                            correct_to_center_val_Y=0;
                        }else if( Math.round(Math.abs(correct_to_center_val_Y-$(".floor3_circle_div").height())) >= gonna_be_height ){                          
                            var correction_val=img_TS_top_current+($(".floor3_circle_div").height()-(gonna_be_height-Math.abs(img_TS_top_current))); 
                            correct_to_center_val_Y=correction_val;
                        }
                  
                     $(ev.target).css("top",Math.round(correct_to_center_val_Y)+"px");
                     
                
                     break;
                    
                        
                        
                 }
                
                 
                 
                 
            //判断此次事件是缩还是放的else结束的大括号
            }
                
            
            
            /*---------------------------------------------------------------------
              在每一次手指缩放事件触发时，都更新那张实际看到的图片的大小和位置（left和top）*/
            $(".seen_img").css("left",$(ev.target).css("left"));
            $(".seen_img").css("top",$(ev.target).css("top"));            
            $(".seen_img").height($(ev.target).height());
            $(".seen_img").width($(ev.target).width());
             /*---------------------------------------------------------------------*/
              
            console.log($(".seen_img").css("left"),
            $(".seen_img").css("top"),
            $(".seen_img").width(),
            $(".seen_img").height());
            
            console.log("----------------");
            
            //hammer.js的手指缩放事件结束的大括号。   
            });
            /*-------------------------------------------------------------------------------
            监听手指缩放束事件（pinchend），这个事件没有什么实质作用，但在调试过程中可以了解什么时候缩放结束
            -----------------------------------------------------------------------------------*/
    
            hammertime.on("pinchend", function(ev) {
                console.log("pinchend");
                
            });
            //将hammer.js的手指移动事件开启为监听所有方向，默认是不监听垂直方向的手指滑动事件的
            hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
            /*-------------------------------------------------------------------------------
            监听手指移动开始事件（panstart）
            -----------------------------------------------------------------------------------*/
    
            hammertime.on("panstart", function(ev) {
                //alert("panstart");
                console.log("panstart");
                 $(ev.target).attr("last_deltaX","0");
                 $(ev.target).attr("last_deltaY","0");
                window.og_left=Math.round(parseFloat($(ev.target).css("left")));
                window.og_top=Math.round(parseFloat($(ev.target).css("top")));
                console.log("点击时的left="+window.og_left);
                console.log("点击时的top="+window.og_top);
                window.touchstart_width=Math.round(parseFloat($(ev.target).width()));
                window.touchstart_height=Math.round(parseFloat($(ev.target).height()));
                console.log("点击时的图片width="+window.touchstart_width);
                
            });
            /*-------------------------------------------------------------------------------
            监听手指移动移动中事件（panmove）
            -----------------------------------------------------------------------------------*/
    
            hammertime.on('panmove', function(ev) {
                console.log(ev);
                //alert("panmove");
              
              
               
                var current_left=Math.round(parseFloat($(ev.target).css("left")));
                var current_top=Math.round(parseFloat($(ev.target).css("top")));
               
                var gonna_add_X=ev.deltaX-parseFloat($(ev.target).attr("last_deltaX"));
                var gonna_add_Y=ev.deltaY-parseFloat($(ev.target).attr("last_deltaY"));
                $(ev.target).attr("last_deltaX",ev.deltaX);
                $(ev.target).attr("last_deltaY",ev.deltaY);
                
                var gonna_be_left=Math.round(current_left+gonna_add_X);
                var gonna_be_top=Math.round(current_top+gonna_add_Y);
               
               
               // console.log(gonna_add_X,gonna_add_Y);
           
                //这四个变量分别代表图片移动时，是否碰到了圆圈的上下左右边
                var LR_L_limited=0;//圆圈左边
                var LR_R_limited=0;//圆圈右边
                var TB_T_limited=0;//圆圈上边
                var TB_B_limited=0;//圆圈下边
            
                
                $(ev.target).css("left",gonna_be_left+"px");
                $(ev.target).css("top",gonna_be_top+"px");
                
        
            
                
                
                    if(gonna_be_left>=0){
                        console.log("碰到左边");
                        var LR_L_limited=1;
                        //$(ev.target).css("left","0px");
                        //$(ev.target).css("top",(window.og_top+ev.deltaY)+"px");
                       
                    }
                    if(gonna_be_left<=-Math.round($(ev.target).width()-$(".floor3_circle_div").width())){
                        console.log("碰到右边");
                        var LR_R_limited=1;
                        //$(ev.target).css("left",-($(ev.target).width()-$(".floor3_div").width())+"px");
                        //$(ev.target).css("top",(window.og_top+ev.deltaY)+"px");
                    }
                    if(gonna_be_top>=0){
                        console.log("碰到上边");
                        var TB_T_limited=1;
                        //$(ev.target).css("left",(window.og_left+ev.deltaX)+"px");
                        //$(ev.target).css("top","0px");
                    }if(gonna_be_top<=-Math.round($(ev.target).height()-$(".floor3_circle_div").height())){
                        console.log("碰到下边");
                        var TB_B_limited=1;
                        //$(ev.target).css("left",(window.og_left+ev.deltaX)+"px");
                        //$(ev.target).css("top",-($(ev.target).height()-$(".floor3_div").height())+"px");
                    }
                    
                
                var result=LR_L_limited+""+LR_R_limited+""+TB_T_limited+""+TB_B_limited;
                console.log(LR_L_limited+""+LR_R_limited+""+TB_T_limited+""+TB_B_limited);
                console.log("------------");
                
                switch (result){                    
                    case  "1000"://左
                        $(ev.target).css("left","0px");
                        $(ev.target).css("top",gonna_be_top+"px");
                        break;      
                        
                    case  "0100"://右
                        $(ev.target).css("left",-Math.round($(ev.target).width()-$(".floor3_circle_div").width())+"px");
                        $(ev.target).css("top",gonna_be_top+"px");
                        break;
                    case  "0010"://上
                        $(ev.target).css("top","0px");
                        $(ev.target).css("left",gonna_be_left+"px");
                        break;
                    case  "0001"://下
                        $(ev.target).css("left",gonna_be_left+"px");
                        $(ev.target).css("top",-Math.round($(ev.target).height()-$(".floor3_circle_div").height())+"px");
                        break;
                        
                    
                    case  "0011"://上下
                        $(ev.target).css("top","0px");
                        $(ev.target).css("left",gonna_be_left+"px");
                        break;
                    case  "0101"://右下
                        $(ev.target).css("left",-Math.round($(ev.target).width()-$(".floor3_circle_div").width())+"px");
                        $(ev.target).css("top",-Math.round($(ev.target).height()-$(".floor3_circle_div").height())+"px");
                        break;
                    case  "1001"://左下
                        $(ev.target).css("left","0px");
                        $(ev.target).css("top",-Math.round($(ev.target).height()-$(".floor3_circle_div").height())+"px");
                        break;
                    case  "0110"://右上
                        $(ev.target).css("left",-Math.round($(ev.target).width()-$(".floor3_circle_div").width())+"px");
                        $(ev.target).css("top","0px");
                        break;
                    case  "1010"://左上
                        $(ev.target).css("left","0px");
                        $(ev.target).css("top","0px");
                        break;
                    case  "1100"://左右
                        $(ev.target).css("left","0px");
                        $(ev.target).css("top",gonna_be_top+"px");
                        break;
                        
                        
                    case  "0111"://右上下
                        $(ev.target).css("top","0px");
                        $(ev.target).css("left",-Math.round($(ev.target).width()-$(".floor3_circle_div").width())+"px");
                        break;
                    case  "1011"://左上下
                        $(ev.target).css("top","0px");
                        $(ev.target).css("left","0px");
                        break;
                    case  "1101"://左右下
                        $(ev.target).css("left","0px");
                        $(ev.target).css("top",-Math.round($(ev.target).height()-$(".floor3_circle_div").height())+"px");           
                        break;
                    case  "1110"://左右上
                        $(ev.target).css("left","0px");
                        $(ev.target).css("top","0px");
                        break;
                        
                        
                        
                    case  "1111"://上下左右
                        $(ev.target).css("top","0px");                      
                        $(ev.target).css("left","0px");                 
                        break;                  
                        
                
                    case  "0000":
                        $(ev.target).css("left",gonna_be_left+"px");
                        $(ev.target).css("top",gonna_be_top+"px");
                        break;
                    
                        
                }
                
                
                
                
                
                
            
                
                    
                /*  
                if(ev.additionalEvent==="panup"){
                    console.log("上滑");
                    
                }else if(ev.additionalEvent==="pandown"){
                    console.log("下滑");
                    
                }else if(ev.additionalEvent==="panleft"){
                    console.log("左滑");
                    
                }else if(ev.additionalEvent==="panright"){
                    console.log("右滑");
                    
                }
                
                */
                
                
                
             /*---------------------------------------------------------------------
              在每一次手指移动事件触发时，都更新那张实际看到的图片的大小和位置（left和top）*/
            $(".seen_img").css("left",$(ev.target).css("left"));
            $(".seen_img").css("top",$(ev.target).css("top"));            
            $(".seen_img").height($(ev.target).height());
            $(".seen_img").width($(ev.target).width());
             /*---------------------------------------------------------------------*/
              
                
                
                
            //hammer.js的pan事件结束的大括号。
            });
            /*-------------------------------------------------------------------------------
            监听手指移动结束事件（panend），和监听手指缩放束事件（pinchend）同理，没有什么实质作用，但在调试过程中可以了解什么时候手指移动结束
            -----------------------------------------------------------------------------------*/
    
            hammertime.on("panend", function(ev) {
                console.log("panend");
                
           
            });
            
            /*-------------------------------------------------------------------------------
            开始加载实际看到的那张图片(注意当前的代码，还是处于隐藏的图片加载完成的回调函数中,也就是说，当隐藏的图片加载完成后,才开始加载可以看到的那张图片)
            --------------------------------------------------------------*/   
            var seen_img = document.createElement('img');
                seen_img.src = param_obj.img_url; 
                $(seen_img).addClass("seen_img");
                $(".seen_img_circle").append($(seen_img));  
                seen_img.onload = function(){
                    
                    if(this.width>=this.height){        
                          //图片宽大于高,将圆圈的直径设为图片高
                          this.height=$(".seen_img_circle").width();   
                          /*
                           $(this).width()/2为图片中心点所对应圆圈左上角的left值
                           $(".floor3_div").width()/2为圆圈的中点对应圆圈左上角的left值
                           $(this).width()/2-$(".floor3_div").width()/2及为让图片中点和圆圈中点重合需要给图片设置的left值         
                          */
                          $(this).css({
                              "position":"relative",
                              "left":Math.round(($(".seen_img_circle").width()/2)-($(this).width()/2))+"px"
                          });
                    }else{
                          //图片宽小于高,将宽设为圆圈的直径
                          this.width=$(".seen_img_circle").width();
                          /*
                            $(this).height()/2为图片中心点所对应圆圈左上角的top值
                            $(".floor3_div").height()/2为圆圈的中点对应圆圈左上角的top值
                            $(this).height()/2-$(".floor3_div").height()/2及为让图片中点和圆圈中点重合需要给图片设置的top值        
                           */
                          $(this).css({
                              "position":"relative",  
                              "top":Math.round(($(".seen_img_circle").height()/2)-($(this).height()/2))+"px"
                          });

                    }
                    
                    
                   /*
                     下面当可见的图片和隐藏的图片都已经加载完成后，此时就代表了裁剪器已经加载完成，
                     于是开始用下面的动画（通过对裁剪器最外层div的left从-100vw到0）来达到动画效果。
                   */
                    $(".floor1_black_div").animate({"left":"0vw"},"fast",function(){
                        param_obj.load_complete_callback();
                    });
                    
                    
                    
                    
                    
                //图片(可见的)加载结束的大括号
                };
            
            
    
            
            
    
    
            
            
        //图片(隐藏的)加载结束(加载成功)的大括号
        };
        
        
        
        
    
    
    
    
    
    
    
    
            /*---------------------------------------------------------------------
              下面开始做确认裁剪的操作
              -----------------------------------------------------------------------*/
              $(".confirm_a").click(function(){
                  
                  /*首先获得裁剪所需的图片(隐藏的那张图片,其实获取显示的那一张图片也是一样的，不过你总得二选一)宽高*/
                  var current_img_width=Math.round(parseFloat($(".hide_image").width()));
                  var current_img_height=Math.round(parseFloat($(".hide_image").height()));
                  
                  
                  /*然后获取最初图片的宽高(最初的没有见过任何缩放的原文件的宽高)*/                 
                  var OG_img_width=Math.round(parseFloat($(window.OG_img_canvas.c).attr("width")));
                  var OG_img_height=Math.round(parseFloat($(window.OG_img_canvas.c).attr("height")));
                    
                  
                  /*最后要获取当前圆形左上角相对于图片左上角的left和top,为后面需要的裁剪坐标做准备*/
                  var current_coordinates_X=Math.abs(Math.round(parseFloat($(".hide_image").css("left"))));
                  var current_coordinates_Y=Math.abs(Math.round(parseFloat($(".hide_image").css("top"))));
                  
                   /*
                    原理：当图片缩放时，屏幕1px的大小是不变的，但图片内部的1px大小是会随缩放而放大缩小的，然而，裁剪所用函数的坐标是相对于。
                    图片内部的1px大小作为单位的，所以我们要求出当前圆圈的屏幕px大小相对于图片内部是多少px
                    
                    根据上面两项数据及原理,不难得到以下公式:
                    $(".floor3_circle_div").width()/current_img_width=X/OG_img_width   (X为所求的在图片内要裁剪的圆圈直径大小)
                    然后用当前圆圈直径/当前图片宽度=X为所求的在图片内要裁剪的圆圈直径大小/最初的图片宽度
                     
                    同样用此原理也可以算出left和right
                   */
                   var ganna_cut_width=($(".floor3_circle_div").width()/current_img_width)*OG_img_width;
                   //var ganna_cut_height=($(".floor3_circle_div").height()/current_img_height)*OG_img_height;
                  
                   /*
                     用上面算直径的，同样原理也可以算出left和top
                   */
                   var ganna_cut_coordinates_X=(current_coordinates_X/current_img_width)*OG_img_width;
                   var ganna_cut_coordinates_Y=(current_coordinates_Y/current_img_height)*OG_img_height;
                  
                   
                   //console.log(ganna_cut_width,ganna_cut_height,ganna_cut_coordinates_X,ganna_cut_coordinates_Y);
                  
                  /*所有参数在上面，已经准备完毕，下面准备裁剪*/
                  
                  //canvas_for_cuted_img是给裁剪后的图片准备的画布
                  var canvas_for_cuted_img = createNewCanvas(ganna_cut_width,ganna_cut_width); 
            
                 
                  var imgData=window.OG_img_canvas.ctx.getImageData(ganna_cut_coordinates_X,ganna_cut_coordinates_Y,ganna_cut_width,ganna_cut_width);
                  canvas_for_cuted_img.ctx.putImageData(imgData,0,0);// 将画布上指定矩形的像素数据，通过 putImageData() 方法将图像数据放回画布
                  
                  var user_wanted_img_type=param_obj.clipped_img_type.toLowerCase();
                  switch(user_wanted_img_type){
                      case "dataurl":
                          var dataUrl=canvas_for_cuted_img.c.toDataURL("image/jpeg",1);
                          $(".floor1_black_div").animate({"left":"-100vw"},"fast",function(){
                              //当动画执行完毕,销毁图片裁剪器，destory_img_clipper是我自己写的函数到最上面看
                              destory_img_clipper();
                              param_obj.click_confirm_callback(dataUrl);
                          });
                          break;
                      case "blob":
                          canvas_for_cuted_img.c.toBlob(function(blob_obj){                              
                              $(".floor1_black_div").animate({"left":"-100vw"},"fast",function(){
                                  //当动画执行完毕,销毁图片裁剪器，destory_img_clipper是我自己写的函数到最上面看
                                  destory_img_clipper();
                                  param_obj.click_confirm_callback(blob_obj);
                              });
                              
                          },"image/jpeg",1);
                          
                          break;
                  //switch结束的大括号
                  }
                  
                  
               
                  
              });
              
              
              /*---------------------------------------------------------------------
              下面开始做取消裁剪的操作
              -----------------------------------------------------------------------*/
              $(".cancel_a").click(function(){
                    /*
                     当用户点击返回后，此时就代表了裁剪器已经加载完成，
                     首先用下面的动画（通过对裁剪器最外层div的left从0到-100vw）来让裁剪器在屏幕中消失
                    */
                    
                    $(".floor1_black_div").animate({"left":"-100vw"},"fast",function(){
                       //当动画执行完毕,销毁图片裁剪器，destory_img_clipper是我自己写的函数到最上面看
                       destory_img_clipper();
                       param_obj.click_cancel_callback();
                    });
                    
              });
              
              
              
              
              
     //图片(用来检测是否能成功加载的那个图片)加载结束(加载成功)的大括号
     };
        

    
    
//start_img_clipper函数结束的大括号
}








/***********************************注意：从这里往下是hammer.js的内容，不用再往下看了******************************************/





function add_hammer_js(){
    
    /*! Hammer.JS - v2.0.7 - 2016-04-22
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2016 Jorik Tangelder;
 * Licensed under the MIT license */
(function(window, document, exportName, undefined) {
  'use strict';

var VENDOR_PREFIXES = ['', 'webkit', 'Moz', 'MS', 'ms', 'o'];
var TEST_ELEMENT = document.createElement('div');

var TYPE_FUNCTION = 'function';

var round = Math.round;
var abs = Math.abs;
var now = Date.now;

/**
 * set a timeout with a given scope
 * @param {Function} fn
 * @param {Number} timeout
 * @param {Object} context
 * @returns {number}
 */
function setTimeoutContext(fn, timeout, context) {
    return setTimeout(bindFn(fn, context), timeout);
}

/**
 * if the argument is an array, we want to execute the fn on each entry
 * if it aint an array we don't want to do a thing.
 * this is used by all the methods that accept a single and array argument.
 * @param {*|Array} arg
 * @param {String} fn
 * @param {Object} [context]
 * @returns {Boolean}
 */
function invokeArrayArg(arg, fn, context) {
    if (Array.isArray(arg)) {
        each(arg, context[fn], context);
        return true;
    }
    return false;
}

/**
 * walk objects and arrays
 * @param {Object} obj
 * @param {Function} iterator
 * @param {Object} context
 */
function each(obj, iterator, context) {
    var i;

    if (!obj) {
        return;
    }

    if (obj.forEach) {
        obj.forEach(iterator, context);
    } else if (obj.length !== undefined) {
        i = 0;
        while (i < obj.length) {
            iterator.call(context, obj[i], i, obj);
            i++;
        }
    } else {
        for (i in obj) {
            obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
        }
    }
}

/**
 * wrap a method with a deprecation warning and stack trace
 * @param {Function} method
 * @param {String} name
 * @param {String} message
 * @returns {Function} A new function wrapping the supplied method.
 */
function deprecate(method, name, message) {
    var deprecationMessage = 'DEPRECATED METHOD: ' + name + '\n' + message + ' AT \n';
    return function() {
        var e = new Error('get-stack-trace');
        var stack = e && e.stack ? e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@') : 'Unknown Stack Trace';

        var log = window.console && (window.console.warn || window.console.log);
        if (log) {
            log.call(window.console, deprecationMessage, stack);
        }
        return method.apply(this, arguments);
    };
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} target
 * @param {...Object} objects_to_assign
 * @returns {Object} target
 */
var assign;
if (typeof Object.assign !== 'function') {
    assign = function assign(target) {
        if (target === undefined || target === null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var output = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source !== undefined && source !== null) {
                for (var nextKey in source) {
                    if (source.hasOwnProperty(nextKey)) {
                        output[nextKey] = source[nextKey];
                    }
                }
            }
        }
        return output;
    };
} else {
    assign = Object.assign;
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} dest
 * @param {Object} src
 * @param {Boolean} [merge=false]
 * @returns {Object} dest
 */
var extend = deprecate(function extend(dest, src, merge) {
    var keys = Object.keys(src);
    var i = 0;
    while (i < keys.length) {
        if (!merge || (merge && dest[keys[i]] === undefined)) {
            dest[keys[i]] = src[keys[i]];
        }
        i++;
    }
    return dest;
}, 'extend', 'Use `assign`.');

/**
 * merge the values from src in the dest.
 * means that properties that exist in dest will not be overwritten by src
 * @param {Object} dest
 * @param {Object} src
 * @returns {Object} dest
 */
var merge = deprecate(function merge(dest, src) {
    return extend(dest, src, true);
}, 'merge', 'Use `assign`.');

/**
 * simple class inheritance
 * @param {Function} child
 * @param {Function} base
 * @param {Object} [properties]
 */
function inherit(child, base, properties) {
    var baseP = base.prototype,
        childP;

    childP = child.prototype = Object.create(baseP);
    childP.constructor = child;
    childP._super = baseP;

    if (properties) {
        assign(childP, properties);
    }
}

/**
 * simple function bind
 * @param {Function} fn
 * @param {Object} context
 * @returns {Function}
 */
function bindFn(fn, context) {
    return function boundFn() {
        return fn.apply(context, arguments);
    };
}

/**
 * let a boolean value also be a function that must return a boolean
 * this first item in args will be used as the context
 * @param {Boolean|Function} val
 * @param {Array} [args]
 * @returns {Boolean}
 */
function boolOrFn(val, args) {
    if (typeof val == TYPE_FUNCTION) {
        return val.apply(args ? args[0] || undefined : undefined, args);
    }
    return val;
}

/**
 * use the val2 when val1 is undefined
 * @param {*} val1
 * @param {*} val2
 * @returns {*}
 */
function ifUndefined(val1, val2) {
    return (val1 === undefined) ? val2 : val1;
}

/**
 * addEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function addEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.addEventListener(type, handler, false);
    });
}

/**
 * removeEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function removeEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.removeEventListener(type, handler, false);
    });
}

/**
 * find if a node is in the given parent
 * @method hasParent
 * @param {HTMLElement} node
 * @param {HTMLElement} parent
 * @return {Boolean} found
 */
function hasParent(node, parent) {
    while (node) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

/**
 * small indexOf wrapper
 * @param {String} str
 * @param {String} find
 * @returns {Boolean} found
 */
function inStr(str, find) {
    return str.indexOf(find) > -1;
}

/**
 * split string on whitespace
 * @param {String} str
 * @returns {Array} words
 */
function splitStr(str) {
    return str.trim().split(/\s+/g);
}

/**
 * find if a array contains the object using indexOf or a simple polyFill
 * @param {Array} src
 * @param {String} find
 * @param {String} [findByKey]
 * @return {Boolean|Number} false when not found, or the index
 */
function inArray(src, find, findByKey) {
    if (src.indexOf && !findByKey) {
        return src.indexOf(find);
    } else {
        var i = 0;
        while (i < src.length) {
            if ((findByKey && src[i][findByKey] == find) || (!findByKey && src[i] === find)) {
                return i;
            }
            i++;
        }
        return -1;
    }
}

/**
 * convert array-like objects to real arrays
 * @param {Object} obj
 * @returns {Array}
 */
function toArray(obj) {
    return Array.prototype.slice.call(obj, 0);
}

/**
 * unique array with objects based on a key (like 'id') or just by the array's value
 * @param {Array} src [{id:1},{id:2},{id:1}]
 * @param {String} [key]
 * @param {Boolean} [sort=False]
 * @returns {Array} [{id:1},{id:2}]
 */
function uniqueArray(src, key, sort) {
    var results = [];
    var values = [];
    var i = 0;

    while (i < src.length) {
        var val = key ? src[i][key] : src[i];
        if (inArray(values, val) < 0) {
            results.push(src[i]);
        }
        values[i] = val;
        i++;
    }

    if (sort) {
        if (!key) {
            results = results.sort();
        } else {
            results = results.sort(function sortUniqueArray(a, b) {
                return a[key] > b[key];
            });
        }
    }

    return results;
}

/**
 * get the prefixed property
 * @param {Object} obj
 * @param {String} property
 * @returns {String|Undefined} prefixed
 */
function prefixed(obj, property) {
    var prefix, prop;
    var camelProp = property[0].toUpperCase() + property.slice(1);

    var i = 0;
    while (i < VENDOR_PREFIXES.length) {
        prefix = VENDOR_PREFIXES[i];
        prop = (prefix) ? prefix + camelProp : property;

        if (prop in obj) {
            return prop;
        }
        i++;
    }
    return undefined;
}

/**
 * get a unique id
 * @returns {number} uniqueId
 */
var _uniqueId = 1;
function uniqueId() {
    return _uniqueId++;
}

/**
 * get the window object of an element
 * @param {HTMLElement} element
 * @returns {DocumentView|Window}
 */
function getWindowForElement(element) {
    var doc = element.ownerDocument || element;
    return (doc.defaultView || doc.parentWindow || window);
}

var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;

var SUPPORT_TOUCH = ('ontouchstart' in window);
var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined;
var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);

var INPUT_TYPE_TOUCH = 'touch';
var INPUT_TYPE_PEN = 'pen';
var INPUT_TYPE_MOUSE = 'mouse';
var INPUT_TYPE_KINECT = 'kinect';

var COMPUTE_INTERVAL = 25;

var INPUT_START = 1;
var INPUT_MOVE = 2;
var INPUT_END = 4;
var INPUT_CANCEL = 8;

var DIRECTION_NONE = 1;
var DIRECTION_LEFT = 2;
var DIRECTION_RIGHT = 4;
var DIRECTION_UP = 8;
var DIRECTION_DOWN = 16;

var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

var PROPS_XY = ['x', 'y'];
var PROPS_CLIENT_XY = ['clientX', 'clientY'];

/**
 * create new input type manager
 * @param {Manager} manager
 * @param {Function} callback
 * @returns {Input}
 * @constructor
 */
function Input(manager, callback) {
    var self = this;
    this.manager = manager;
    this.callback = callback;
    this.element = manager.element;
    this.target = manager.options.inputTarget;

    // smaller wrapper around the handler, for the scope and the enabled state of the manager,
    // so when disabled the input events are completely bypassed.
    this.domHandler = function(ev) {
        if (boolOrFn(manager.options.enable, [manager])) {
            self.handler(ev);
        }
    };

    this.init();

}

Input.prototype = {
    /**
     * should handle the inputEvent data and trigger the callback
     * @virtual
     */
    handler: function() { },

    /**
     * bind the events
     */
    init: function() {
        this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    },

    /**
     * unbind the events
     */
    destroy: function() {
        this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    }
};

/**
 * create new input type manager
 * called by the Manager constructor
 * @param {Hammer} manager
 * @returns {Input}
 */
function createInputInstance(manager) {
    var Type;
    var inputClass = manager.options.inputClass;

    if (inputClass) {
        Type = inputClass;
    } else if (SUPPORT_POINTER_EVENTS) {
        Type = PointerEventInput;
    } else if (SUPPORT_ONLY_TOUCH) {
        Type = TouchInput;
    } else if (!SUPPORT_TOUCH) {
        Type = MouseInput;
    } else {
        Type = TouchMouseInput;
    }
    return new (Type)(manager, inputHandler);
}

/**
 * handle input events
 * @param {Manager} manager
 * @param {String} eventType
 * @param {Object} input
 */
function inputHandler(manager, eventType, input) {
    var pointersLen = input.pointers.length;
    var changedPointersLen = input.changedPointers.length;
    var isFirst = (eventType & INPUT_START && (pointersLen - changedPointersLen === 0));
    var isFinal = (eventType & (INPUT_END | INPUT_CANCEL) && (pointersLen - changedPointersLen === 0));

    input.isFirst = !!isFirst;
    input.isFinal = !!isFinal;

    if (isFirst) {
        manager.session = {};
    }

    // source event is the normalized value of the domEvents
    // like 'touchstart, mouseup, pointerdown'
    input.eventType = eventType;

    // compute scale, rotation etc
    computeInputData(manager, input);

    // emit secret event
    manager.emit('hammer.input', input);

    manager.recognize(input);
    manager.session.prevInput = input;
}

/**
 * extend the data with some usable properties like scale, rotate, velocity etc
 * @param {Object} manager
 * @param {Object} input
 */
function computeInputData(manager, input) {
    var session = manager.session;
    var pointers = input.pointers;
    var pointersLength = pointers.length;

    // store the first input to calculate the distance and direction
    if (!session.firstInput) {
        session.firstInput = simpleCloneInputData(input);
    }

    // to compute scale and rotation we need to store the multiple touches
    if (pointersLength > 1 && !session.firstMultiple) {
        session.firstMultiple = simpleCloneInputData(input);
    } else if (pointersLength === 1) {
        session.firstMultiple = false;
    }

    var firstInput = session.firstInput;
    var firstMultiple = session.firstMultiple;
    var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;

    var center = input.center = getCenter(pointers);
    input.timeStamp = now();
    input.deltaTime = input.timeStamp - firstInput.timeStamp;

    input.angle = getAngle(offsetCenter, center);
    input.distance = getDistance(offsetCenter, center);

    computeDeltaXY(session, input);
    input.offsetDirection = getDirection(input.deltaX, input.deltaY);

    var overallVelocity = getVelocity(input.deltaTime, input.deltaX, input.deltaY);
    input.overallVelocityX = overallVelocity.x;
    input.overallVelocityY = overallVelocity.y;
    input.overallVelocity = (abs(overallVelocity.x) > abs(overallVelocity.y)) ? overallVelocity.x : overallVelocity.y;

    input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
    input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;

    input.maxPointers = !session.prevInput ? input.pointers.length : ((input.pointers.length >
        session.prevInput.maxPointers) ? input.pointers.length : session.prevInput.maxPointers);

    computeIntervalInputData(session, input);

    // find the correct target
    var target = manager.element;
    if (hasParent(input.srcEvent.target, target)) {
        target = input.srcEvent.target;
    }
    input.target = target;
}

function computeDeltaXY(session, input) {
    var center = input.center;
    var offset = session.offsetDelta || {};
    var prevDelta = session.prevDelta || {};
    var prevInput = session.prevInput || {};

    if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
        prevDelta = session.prevDelta = {
            x: prevInput.deltaX || 0,
            y: prevInput.deltaY || 0
        };

        offset = session.offsetDelta = {
            x: center.x,
            y: center.y
        };
    }

    input.deltaX = prevDelta.x + (center.x - offset.x);
    input.deltaY = prevDelta.y + (center.y - offset.y);
}

/**
 * velocity is calculated every x ms
 * @param {Object} session
 * @param {Object} input
 */
function computeIntervalInputData(session, input) {
    var last = session.lastInterval || input,
        deltaTime = input.timeStamp - last.timeStamp,
        velocity, velocityX, velocityY, direction;

    if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined)) {
        var deltaX = input.deltaX - last.deltaX;
        var deltaY = input.deltaY - last.deltaY;

        var v = getVelocity(deltaTime, deltaX, deltaY);
        velocityX = v.x;
        velocityY = v.y;
        velocity = (abs(v.x) > abs(v.y)) ? v.x : v.y;
        direction = getDirection(deltaX, deltaY);

        session.lastInterval = input;
    } else {
        // use latest velocity info if it doesn't overtake a minimum period
        velocity = last.velocity;
        velocityX = last.velocityX;
        velocityY = last.velocityY;
        direction = last.direction;
    }

    input.velocity = velocity;
    input.velocityX = velocityX;
    input.velocityY = velocityY;
    input.direction = direction;
}

/**
 * create a simple clone from the input used for storage of firstInput and firstMultiple
 * @param {Object} input
 * @returns {Object} clonedInputData
 */
function simpleCloneInputData(input) {
    // make a simple copy of the pointers because we will get a reference if we don't
    // we only need clientXY for the calculations
    var pointers = [];
    var i = 0;
    while (i < input.pointers.length) {
        pointers[i] = {
            clientX: round(input.pointers[i].clientX),
            clientY: round(input.pointers[i].clientY)
        };
        i++;
    }

    return {
        timeStamp: now(),
        pointers: pointers,
        center: getCenter(pointers),
        deltaX: input.deltaX,
        deltaY: input.deltaY
    };
}

/**
 * get the center of all the pointers
 * @param {Array} pointers
 * @return {Object} center contains `x` and `y` properties
 */
function getCenter(pointers) {
    var pointersLength = pointers.length;

    // no need to loop when only one touch
    if (pointersLength === 1) {
        return {
            x: round(pointers[0].clientX),
            y: round(pointers[0].clientY)
        };
    }

    var x = 0, y = 0, i = 0;
    while (i < pointersLength) {
        x += pointers[i].clientX;
        y += pointers[i].clientY;
        i++;
    }

    return {
        x: round(x / pointersLength),
        y: round(y / pointersLength)
    };
}

/**
 * calculate the velocity between two points. unit is in px per ms.
 * @param {Number} deltaTime
 * @param {Number} x
 * @param {Number} y
 * @return {Object} velocity `x` and `y`
 */
function getVelocity(deltaTime, x, y) {
    return {
        x: x / deltaTime || 0,
        y: y / deltaTime || 0
    };
}

/**
 * get the direction between two points
 * @param {Number} x
 * @param {Number} y
 * @return {Number} direction
 */
function getDirection(x, y) {
    if (x === y) {
        return DIRECTION_NONE;
    }

    if (abs(x) >= abs(y)) {
        return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
    return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
}

/**
 * calculate the absolute distance between two points
 * @param {Object} p1 {x, y}
 * @param {Object} p2 {x, y}
 * @param {Array} [props] containing x and y keys
 * @return {Number} distance
 */
function getDistance(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];

    return Math.sqrt((x * x) + (y * y));
}

/**
 * calculate the angle between two coordinates
 * @param {Object} p1
 * @param {Object} p2
 * @param {Array} [props] containing x and y keys
 * @return {Number} angle
 */
function getAngle(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];
    return Math.atan2(y, x) * 180 / Math.PI;
}

/**
 * calculate the rotation degrees between two pointersets
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} rotation
 */
function getRotation(start, end) {
    return getAngle(end[1], end[0], PROPS_CLIENT_XY) + getAngle(start[1], start[0], PROPS_CLIENT_XY);
}

/**
 * calculate the scale factor between two pointersets
 * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} scale
 */
function getScale(start, end) {
    return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
}

var MOUSE_INPUT_MAP = {
    mousedown: INPUT_START,
    mousemove: INPUT_MOVE,
    mouseup: INPUT_END
};

var MOUSE_ELEMENT_EVENTS = 'mousedown';
var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';

/**
 * Mouse events input
 * @constructor
 * @extends Input
 */
function MouseInput() {
    this.evEl = MOUSE_ELEMENT_EVENTS;
    this.evWin = MOUSE_WINDOW_EVENTS;

    this.pressed = false; // mousedown state

    Input.apply(this, arguments);
}

inherit(MouseInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function MEhandler(ev) {
        var eventType = MOUSE_INPUT_MAP[ev.type];

        // on start we want to have the left mouse button down
        if (eventType & INPUT_START && ev.button === 0) {
            this.pressed = true;
        }

        if (eventType & INPUT_MOVE && ev.which !== 1) {
            eventType = INPUT_END;
        }

        // mouse must be down
        if (!this.pressed) {
            return;
        }

        if (eventType & INPUT_END) {
            this.pressed = false;
        }

        this.callback(this.manager, eventType, {
            pointers: [ev],
            changedPointers: [ev],
            pointerType: INPUT_TYPE_MOUSE,
            srcEvent: ev
        });
    }
});

var POINTER_INPUT_MAP = {
    pointerdown: INPUT_START,
    pointermove: INPUT_MOVE,
    pointerup: INPUT_END,
    pointercancel: INPUT_CANCEL,
    pointerout: INPUT_CANCEL
};

// in IE10 the pointer types is defined as an enum
var IE10_POINTER_TYPE_ENUM = {
    2: INPUT_TYPE_TOUCH,
    3: INPUT_TYPE_PEN,
    4: INPUT_TYPE_MOUSE,
    5: INPUT_TYPE_KINECT // see https://twitter.com/jacobrossi/status/480596438489890816
};

var POINTER_ELEMENT_EVENTS = 'pointerdown';
var POINTER_WINDOW_EVENTS = 'pointermove pointerup pointercancel';

// IE10 has prefixed support, and case-sensitive
if (window.MSPointerEvent && !window.PointerEvent) {
    POINTER_ELEMENT_EVENTS = 'MSPointerDown';
    POINTER_WINDOW_EVENTS = 'MSPointerMove MSPointerUp MSPointerCancel';
}

/**
 * Pointer events input
 * @constructor
 * @extends Input
 */
function PointerEventInput() {
    this.evEl = POINTER_ELEMENT_EVENTS;
    this.evWin = POINTER_WINDOW_EVENTS;

    Input.apply(this, arguments);

    this.store = (this.manager.session.pointerEvents = []);
}

inherit(PointerEventInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function PEhandler(ev) {
        var store = this.store;
        var removePointer = false;

        var eventTypeNormalized = ev.type.toLowerCase().replace('ms', '');
        var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
        var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;

        var isTouch = (pointerType == INPUT_TYPE_TOUCH);

        // get index of the event in the store
        var storeIndex = inArray(store, ev.pointerId, 'pointerId');

        // start and mouse must be down
        if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
            if (storeIndex < 0) {
                store.push(ev);
                storeIndex = store.length - 1;
            }
        } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
            removePointer = true;
        }

        // it not found, so the pointer hasn't been down (so it's probably a hover)
        if (storeIndex < 0) {
            return;
        }

        // update the event in the store
        store[storeIndex] = ev;

        this.callback(this.manager, eventType, {
            pointers: store,
            changedPointers: [ev],
            pointerType: pointerType,
            srcEvent: ev
        });

        if (removePointer) {
            // remove from the store
            store.splice(storeIndex, 1);
        }
    }
});

var SINGLE_TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var SINGLE_TOUCH_TARGET_EVENTS = 'touchstart';
var SINGLE_TOUCH_WINDOW_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Touch events input
 * @constructor
 * @extends Input
 */
function SingleTouchInput() {
    this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
    this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
    this.started = false;

    Input.apply(this, arguments);
}

inherit(SingleTouchInput, Input, {
    handler: function TEhandler(ev) {
        var type = SINGLE_TOUCH_INPUT_MAP[ev.type];

        // should we handle the touch events?
        if (type === INPUT_START) {
            this.started = true;
        }

        if (!this.started) {
            return;
        }

        var touches = normalizeSingleTouches.call(this, ev, type);

        // when done, reset the started state
        if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
            this.started = false;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function normalizeSingleTouches(ev, type) {
    var all = toArray(ev.touches);
    var changed = toArray(ev.changedTouches);

    if (type & (INPUT_END | INPUT_CANCEL)) {
        all = uniqueArray(all.concat(changed), 'identifier', true);
    }

    return [all, changed];
}

var TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var TOUCH_TARGET_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Multi-user touch events input
 * @constructor
 * @extends Input
 */
function TouchInput() {
    this.evTarget = TOUCH_TARGET_EVENTS;
    this.targetIds = {};

    Input.apply(this, arguments);
}

inherit(TouchInput, Input, {
    handler: function MTEhandler(ev) {
        var type = TOUCH_INPUT_MAP[ev.type];
        var touches = getTouches.call(this, ev, type);
        if (!touches) {
            return;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function getTouches(ev, type) {
    var allTouches = toArray(ev.touches);
    var targetIds = this.targetIds;

    // when there is only one touch, the process can be simplified
    if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
        targetIds[allTouches[0].identifier] = true;
        return [allTouches, allTouches];
    }

    var i,
        targetTouches,
        changedTouches = toArray(ev.changedTouches),
        changedTargetTouches = [],
        target = this.target;

    // get target touches from touches
    targetTouches = allTouches.filter(function(touch) {
        return hasParent(touch.target, target);
    });

    // collect touches
    if (type === INPUT_START) {
        i = 0;
        while (i < targetTouches.length) {
            targetIds[targetTouches[i].identifier] = true;
            i++;
        }
    }

    // filter changed touches to only contain touches that exist in the collected target ids
    i = 0;
    while (i < changedTouches.length) {
        if (targetIds[changedTouches[i].identifier]) {
            changedTargetTouches.push(changedTouches[i]);
        }

        // cleanup removed touches
        if (type & (INPUT_END | INPUT_CANCEL)) {
            delete targetIds[changedTouches[i].identifier];
        }
        i++;
    }

    if (!changedTargetTouches.length) {
        return;
    }

    return [
        // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
        uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true),
        changedTargetTouches
    ];
}

/**
 * Combined touch and mouse input
 *
 * Touch has a higher priority then mouse, and while touching no mouse events are allowed.
 * This because touch devices also emit mouse events while doing a touch.
 *
 * @constructor
 * @extends Input
 */

var DEDUP_TIMEOUT = 2500;
var DEDUP_DISTANCE = 25;

function TouchMouseInput() {
    Input.apply(this, arguments);

    var handler = bindFn(this.handler, this);
    this.touch = new TouchInput(this.manager, handler);
    this.mouse = new MouseInput(this.manager, handler);

    this.primaryTouch = null;
    this.lastTouches = [];
}

inherit(TouchMouseInput, Input, {
    /**
     * handle mouse and touch events
     * @param {Hammer} manager
     * @param {String} inputEvent
     * @param {Object} inputData
     */
    handler: function TMEhandler(manager, inputEvent, inputData) {
        var isTouch = (inputData.pointerType == INPUT_TYPE_TOUCH),
            isMouse = (inputData.pointerType == INPUT_TYPE_MOUSE);

        if (isMouse && inputData.sourceCapabilities && inputData.sourceCapabilities.firesTouchEvents) {
            return;
        }

        // when we're in a touch event, record touches to  de-dupe synthetic mouse event
        if (isTouch) {
            recordTouches.call(this, inputEvent, inputData);
        } else if (isMouse && isSyntheticEvent.call(this, inputData)) {
            return;
        }

        this.callback(manager, inputEvent, inputData);
    },

    /**
     * remove the event listeners
     */
    destroy: function destroy() {
        this.touch.destroy();
        this.mouse.destroy();
    }
});

function recordTouches(eventType, eventData) {
    if (eventType & INPUT_START) {
        this.primaryTouch = eventData.changedPointers[0].identifier;
        setLastTouch.call(this, eventData);
    } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
        setLastTouch.call(this, eventData);
    }
}

function setLastTouch(eventData) {
    var touch = eventData.changedPointers[0];

    if (touch.identifier === this.primaryTouch) {
        var lastTouch = {x: touch.clientX, y: touch.clientY};
        this.lastTouches.push(lastTouch);
        var lts = this.lastTouches;
        var removeLastTouch = function() {
            var i = lts.indexOf(lastTouch);
            if (i > -1) {
                lts.splice(i, 1);
            }
        };
        setTimeout(removeLastTouch, DEDUP_TIMEOUT);
    }
}

function isSyntheticEvent(eventData) {
    var x = eventData.srcEvent.clientX, y = eventData.srcEvent.clientY;
    for (var i = 0; i < this.lastTouches.length; i++) {
        var t = this.lastTouches[i];
        var dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
        if (dx <= DEDUP_DISTANCE && dy <= DEDUP_DISTANCE) {
            return true;
        }
    }
    return false;
}

var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, 'touchAction');
var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined;

// magical touchAction value
var TOUCH_ACTION_COMPUTE = 'compute';
var TOUCH_ACTION_AUTO = 'auto';
var TOUCH_ACTION_MANIPULATION = 'manipulation'; // not implemented
var TOUCH_ACTION_NONE = 'none';
var TOUCH_ACTION_PAN_X = 'pan-x';
var TOUCH_ACTION_PAN_Y = 'pan-y';
var TOUCH_ACTION_MAP = getTouchActionProps();

/**
 * Touch Action
 * sets the touchAction property or uses the js alternative
 * @param {Manager} manager
 * @param {String} value
 * @constructor
 */
function TouchAction(manager, value) {
    this.manager = manager;
    this.set(value);
}

TouchAction.prototype = {
    /**
     * set the touchAction value on the element or enable the polyfill
     * @param {String} value
     */
    set: function(value) {
        // find out the touch-action by the event handlers
        if (value == TOUCH_ACTION_COMPUTE) {
            value = this.compute();
        }

        if (NATIVE_TOUCH_ACTION && this.manager.element.style && TOUCH_ACTION_MAP[value]) {
            this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
        }
        this.actions = value.toLowerCase().trim();
    },

    /**
     * just re-set the touchAction value
     */
    update: function() {
        this.set(this.manager.options.touchAction);
    },

    /**
     * compute the value for the touchAction property based on the recognizer's settings
     * @returns {String} value
     */
    compute: function() {
        var actions = [];
        each(this.manager.recognizers, function(recognizer) {
            if (boolOrFn(recognizer.options.enable, [recognizer])) {
                actions = actions.concat(recognizer.getTouchAction());
            }
        });
        return cleanTouchActions(actions.join(' '));
    },

    /**
     * this method is called on each input cycle and provides the preventing of the browser behavior
     * @param {Object} input
     */
    preventDefaults: function(input) {
        var srcEvent = input.srcEvent;
        var direction = input.offsetDirection;

        // if the touch action did prevented once this session
        if (this.manager.session.prevented) {
            srcEvent.preventDefault();
            return;
        }

        var actions = this.actions;
        var hasNone = inStr(actions, TOUCH_ACTION_NONE) && !TOUCH_ACTION_MAP[TOUCH_ACTION_NONE];
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_Y];
        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_X];

        if (hasNone) {
            //do not prevent defaults if this is a tap gesture

            var isTapPointer = input.pointers.length === 1;
            var isTapMovement = input.distance < 2;
            var isTapTouchTime = input.deltaTime < 250;

            if (isTapPointer && isTapMovement && isTapTouchTime) {
                return;
            }
        }

        if (hasPanX && hasPanY) {
            // `pan-x pan-y` means browser handles all scrolling/panning, do not prevent
            return;
        }

        if (hasNone ||
            (hasPanY && direction & DIRECTION_HORIZONTAL) ||
            (hasPanX && direction & DIRECTION_VERTICAL)) {
            return this.preventSrc(srcEvent);
        }
    },

    /**
     * call preventDefault to prevent the browser's default behavior (scrolling in most cases)
     * @param {Object} srcEvent
     */
    preventSrc: function(srcEvent) {
        this.manager.session.prevented = true;
        srcEvent.preventDefault();
    }
};

/**
 * when the touchActions are collected they are not a valid value, so we need to clean things up. *
 * @param {String} actions
 * @returns {*}
 */
function cleanTouchActions(actions) {
    // none
    if (inStr(actions, TOUCH_ACTION_NONE)) {
        return TOUCH_ACTION_NONE;
    }

    var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
    var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);

    // if both pan-x and pan-y are set (different recognizers
    // for different directions, e.g. horizontal pan but vertical swipe?)
    // we need none (as otherwise with pan-x pan-y combined none of these
    // recognizers will work, since the browser would handle all panning
    if (hasPanX && hasPanY) {
        return TOUCH_ACTION_NONE;
    }

    // pan-x OR pan-y
    if (hasPanX || hasPanY) {
        return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
    }

    // manipulation
    if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
        return TOUCH_ACTION_MANIPULATION;
    }

    return TOUCH_ACTION_AUTO;
}

function getTouchActionProps() {
    if (!NATIVE_TOUCH_ACTION) {
        return false;
    }
    var touchMap = {};
    var cssSupports = window.CSS && window.CSS.supports;
    ['auto', 'manipulation', 'pan-y', 'pan-x', 'pan-x pan-y', 'none'].forEach(function(val) {

        // If css.supports is not supported but there is native touch-action assume it supports
        // all values. This is the case for IE 10 and 11.
        touchMap[val] = cssSupports ? window.CSS.supports('touch-action', val) : true;
    });
    return touchMap;
}

/**
 * Recognizer flow explained; *
 * All recognizers have the initial state of POSSIBLE when a input session starts.
 * The definition of a input session is from the first input until the last input, with all it's movement in it. *
 * Example session for mouse-input: mousedown -> mousemove -> mouseup
 *
 * On each recognizing cycle (see Manager.recognize) the .recognize() method is executed
 * which determines with state it should be.
 *
 * If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED), it is reset to
 * POSSIBLE to give it another change on the next cycle.
 *
 *               Possible
 *                  |
 *            +-----+---------------+
 *            |                     |
 *      +-----+-----+               |
 *      |           |               |
 *   Failed      Cancelled          |
 *                          +-------+------+
 *                          |              |
 *                      Recognized       Began
 *                                         |
 *                                      Changed
 *                                         |
 *                                  Ended/Recognized
 */
var STATE_POSSIBLE = 1;
var STATE_BEGAN = 2;
var STATE_CHANGED = 4;
var STATE_ENDED = 8;
var STATE_RECOGNIZED = STATE_ENDED;
var STATE_CANCELLED = 16;
var STATE_FAILED = 32;

/**
 * Recognizer
 * Every recognizer needs to extend from this class.
 * @constructor
 * @param {Object} options
 */
function Recognizer(options) {
    this.options = assign({}, this.defaults, options || {});

    this.id = uniqueId();

    this.manager = null;

    // default is enable true
    this.options.enable = ifUndefined(this.options.enable, true);

    this.state = STATE_POSSIBLE;

    this.simultaneous = {};
    this.requireFail = [];
}

Recognizer.prototype = {
    /**
     * @virtual
     * @type {Object}
     */
    defaults: {},

    /**
     * set options
     * @param {Object} options
     * @return {Recognizer}
     */
    set: function(options) {
        assign(this.options, options);

        // also update the touchAction, in case something changed about the directions/enabled state
        this.manager && this.manager.touchAction.update();
        return this;
    },

    /**
     * recognize simultaneous with an other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    recognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'recognizeWith', this)) {
            return this;
        }

        var simultaneous = this.simultaneous;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (!simultaneous[otherRecognizer.id]) {
            simultaneous[otherRecognizer.id] = otherRecognizer;
            otherRecognizer.recognizeWith(this);
        }
        return this;
    },

    /**
     * drop the simultaneous link. it doesnt remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRecognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRecognizeWith', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        delete this.simultaneous[otherRecognizer.id];
        return this;
    },

    /**
     * recognizer can only run when an other is failing
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    requireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'requireFailure', this)) {
            return this;
        }

        var requireFail = this.requireFail;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (inArray(requireFail, otherRecognizer) === -1) {
            requireFail.push(otherRecognizer);
            otherRecognizer.requireFailure(this);
        }
        return this;
    },

    /**
     * drop the requireFailure link. it does not remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRequireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRequireFailure', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        var index = inArray(this.requireFail, otherRecognizer);
        if (index > -1) {
            this.requireFail.splice(index, 1);
        }
        return this;
    },

    /**
     * has require failures boolean
     * @returns {boolean}
     */
    hasRequireFailures: function() {
        return this.requireFail.length > 0;
    },

    /**
     * if the recognizer can recognize simultaneous with an other recognizer
     * @param {Recognizer} otherRecognizer
     * @returns {Boolean}
     */
    canRecognizeWith: function(otherRecognizer) {
        return !!this.simultaneous[otherRecognizer.id];
    },

    /**
     * You should use `tryEmit` instead of `emit` directly to check
     * that all the needed recognizers has failed before emitting.
     * @param {Object} input
     */
    emit: function(input) {
        var self = this;
        var state = this.state;

        function emit(event) {
            self.manager.emit(event, input);
        }

        // 'panstart' and 'panmove'
        if (state < STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }

        emit(self.options.event); // simple 'eventName' events

        if (input.additionalEvent) { // additional event(panleft, panright, pinchin, pinchout...)
            emit(input.additionalEvent);
        }

        // panend and pancancel
        if (state >= STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }
    },

    /**
     * Check that all the require failure recognizers has failed,
     * if true, it emits a gesture event,
     * otherwise, setup the state to FAILED.
     * @param {Object} input
     */
    tryEmit: function(input) {
        if (this.canEmit()) {
            return this.emit(input);
        }
        // it's failing anyway
        this.state = STATE_FAILED;
    },

    /**
     * can we emit?
     * @returns {boolean}
     */
    canEmit: function() {
        var i = 0;
        while (i < this.requireFail.length) {
            if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
                return false;
            }
            i++;
        }
        return true;
    },

    /**
     * update the recognizer
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        // make a new copy of the inputData
        // so we can change the inputData without messing up the other recognizers
        var inputDataClone = assign({}, inputData);

        // is is enabled and allow recognizing?
        if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
            this.reset();
            this.state = STATE_FAILED;
            return;
        }

        // reset when we've reached the end
        if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
            this.state = STATE_POSSIBLE;
        }

        this.state = this.process(inputDataClone);

        // the recognizer has recognized a gesture
        // so trigger an event
        if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
            this.tryEmit(inputDataClone);
        }
    },

    /**
     * return the state of the recognizer
     * the actual recognizing happens in this method
     * @virtual
     * @param {Object} inputData
     * @returns {Const} STATE
     */
    process: function(inputData) { }, // jshint ignore:line

    /**
     * return the preferred touch-action
     * @virtual
     * @returns {Array}
     */
    getTouchAction: function() { },

    /**
     * called when the gesture isn't allowed to recognize
     * like when another is being recognized or it is disabled
     * @virtual
     */
    reset: function() { }
};

/**
 * get a usable string, used as event postfix
 * @param {Const} state
 * @returns {String} state
 */
function stateStr(state) {
    if (state & STATE_CANCELLED) {
        return 'cancel';
    } else if (state & STATE_ENDED) {
        return 'end';
    } else if (state & STATE_CHANGED) {
        return 'move';
    } else if (state & STATE_BEGAN) {
        return 'start';
    }
    return '';
}

/**
 * direction cons to string
 * @param {Const} direction
 * @returns {String}
 */
function directionStr(direction) {
    if (direction == DIRECTION_DOWN) {
        return 'down';
    } else if (direction == DIRECTION_UP) {
        return 'up';
    } else if (direction == DIRECTION_LEFT) {
        return 'left';
    } else if (direction == DIRECTION_RIGHT) {
        return 'right';
    }
    return '';
}

/**
 * get a recognizer by name if it is bound to a manager
 * @param {Recognizer|String} otherRecognizer
 * @param {Recognizer} recognizer
 * @returns {Recognizer}
 */
function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
    var manager = recognizer.manager;
    if (manager) {
        return manager.get(otherRecognizer);
    }
    return otherRecognizer;
}

/**
 * This recognizer is just used as a base for the simple attribute recognizers.
 * @constructor
 * @extends Recognizer
 */
function AttrRecognizer() {
    Recognizer.apply(this, arguments);
}

inherit(AttrRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof AttrRecognizer
     */
    defaults: {
        /**
         * @type {Number}
         * @default 1
         */
        pointers: 1
    },

    /**
     * Used to check if it the recognizer receives valid input, like input.distance > 10.
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {Boolean} recognized
     */
    attrTest: function(input) {
        var optionPointers = this.options.pointers;
        return optionPointers === 0 || input.pointers.length === optionPointers;
    },

    /**
     * Process the input and return the state for the recognizer
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {*} State
     */
    process: function(input) {
        var state = this.state;
        var eventType = input.eventType;

        var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
        var isValid = this.attrTest(input);

        // on cancel input and we've recognized before, return STATE_CANCELLED
        if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
            return state | STATE_CANCELLED;
        } else if (isRecognized || isValid) {
            if (eventType & INPUT_END) {
                return state | STATE_ENDED;
            } else if (!(state & STATE_BEGAN)) {
                return STATE_BEGAN;
            }
            return state | STATE_CHANGED;
        }
        return STATE_FAILED;
    }
});

/**
 * Pan
 * Recognized when the pointer is down and moved in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function PanRecognizer() {
    AttrRecognizer.apply(this, arguments);

    this.pX = null;
    this.pY = null;
}

inherit(PanRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PanRecognizer
     */
    defaults: {
        event: 'pan',
        threshold: 10,
        pointers: 1,
        direction: DIRECTION_ALL
    },

    getTouchAction: function() {
        var direction = this.options.direction;
        var actions = [];
        if (direction & DIRECTION_HORIZONTAL) {
            actions.push(TOUCH_ACTION_PAN_Y);
        }
        if (direction & DIRECTION_VERTICAL) {
            actions.push(TOUCH_ACTION_PAN_X);
        }
        return actions;
    },

    directionTest: function(input) {
        var options = this.options;
        var hasMoved = true;
        var distance = input.distance;
        var direction = input.direction;
        var x = input.deltaX;
        var y = input.deltaY;

        // lock to axis?
        if (!(direction & options.direction)) {
            if (options.direction & DIRECTION_HORIZONTAL) {
                direction = (x === 0) ? DIRECTION_NONE : (x < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                hasMoved = x != this.pX;
                distance = Math.abs(input.deltaX);
            } else {
                direction = (y === 0) ? DIRECTION_NONE : (y < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                hasMoved = y != this.pY;
                distance = Math.abs(input.deltaY);
            }
        }
        input.direction = direction;
        return hasMoved && distance > options.threshold && direction & options.direction;
    },

    attrTest: function(input) {
        return AttrRecognizer.prototype.attrTest.call(this, input) &&
            (this.state & STATE_BEGAN || (!(this.state & STATE_BEGAN) && this.directionTest(input)));
    },

    emit: function(input) {

        this.pX = input.deltaX;
        this.pY = input.deltaY;

        var direction = directionStr(input.direction);

        if (direction) {
            input.additionalEvent = this.options.event + direction;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Pinch
 * Recognized when two or more pointers are moving toward (zoom-in) or away from each other (zoom-out).
 * @constructor
 * @extends AttrRecognizer
 */
function PinchRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(PinchRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'pinch',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
    },

    emit: function(input) {
        if (input.scale !== 1) {
            var inOut = input.scale < 1 ? 'in' : 'out';
            input.additionalEvent = this.options.event + inOut;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Press
 * Recognized when the pointer is down for x ms without any movement.
 * @constructor
 * @extends Recognizer
 */
function PressRecognizer() {
    Recognizer.apply(this, arguments);

    this._timer = null;
    this._input = null;
}

inherit(PressRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PressRecognizer
     */
    defaults: {
        event: 'press',
        pointers: 1,
        time: 251, // minimal time of the pointer to be pressed
        threshold: 9 // a minimal movement is ok, but keep it low
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_AUTO];
    },

    process: function(input) {
        var options = this.options;
        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTime = input.deltaTime > options.time;

        this._input = input;

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (!validMovement || !validPointers || (input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime)) {
            this.reset();
        } else if (input.eventType & INPUT_START) {
            this.reset();
            this._timer = setTimeoutContext(function() {
                this.state = STATE_RECOGNIZED;
                this.tryEmit();
            }, options.time, this);
        } else if (input.eventType & INPUT_END) {
            return STATE_RECOGNIZED;
        }
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function(input) {
        if (this.state !== STATE_RECOGNIZED) {
            return;
        }

        if (input && (input.eventType & INPUT_END)) {
            this.manager.emit(this.options.event + 'up', input);
        } else {
            this._input.timeStamp = now();
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Rotate
 * Recognized when two or more pointer are moving in a circular motion.
 * @constructor
 * @extends AttrRecognizer
 */
function RotateRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(RotateRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof RotateRecognizer
     */
    defaults: {
        event: 'rotate',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
    }
});

/**
 * Swipe
 * Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function SwipeRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(SwipeRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof SwipeRecognizer
     */
    defaults: {
        event: 'swipe',
        threshold: 10,
        velocity: 0.3,
        direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
        pointers: 1
    },

    getTouchAction: function() {
        return PanRecognizer.prototype.getTouchAction.call(this);
    },

    attrTest: function(input) {
        var direction = this.options.direction;
        var velocity;

        if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
            velocity = input.overallVelocity;
        } else if (direction & DIRECTION_HORIZONTAL) {
            velocity = input.overallVelocityX;
        } else if (direction & DIRECTION_VERTICAL) {
            velocity = input.overallVelocityY;
        }

        return this._super.attrTest.call(this, input) &&
            direction & input.offsetDirection &&
            input.distance > this.options.threshold &&
            input.maxPointers == this.options.pointers &&
            abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
    },

    emit: function(input) {
        var direction = directionStr(input.offsetDirection);
        if (direction) {
            this.manager.emit(this.options.event + direction, input);
        }

        this.manager.emit(this.options.event, input);
    }
});

/**
 * A tap is ecognized when the pointer is doing a small tap/click. Multiple taps are recognized if they occur
 * between the given interval and position. The delay option can be used to recognize multi-taps without firing
 * a single tap.
 *
 * The eventData from the emitted event contains the property `tapCount`, which contains the amount of
 * multi-taps being recognized.
 * @constructor
 * @extends Recognizer
 */
function TapRecognizer() {
    Recognizer.apply(this, arguments);

    // previous time and center,
    // used for tap counting
    this.pTime = false;
    this.pCenter = false;

    this._timer = null;
    this._input = null;
    this.count = 0;
}

inherit(TapRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'tap',
        pointers: 1,
        taps: 1,
        interval: 300, // max time between the multi-tap taps
        time: 250, // max time of the pointer to be down (like finger on the screen)
        threshold: 9, // a minimal movement is ok, but keep it low
        posThreshold: 10 // a multi-tap can be a bit off the initial position
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_MANIPULATION];
    },

    process: function(input) {
        var options = this.options;

        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTouchTime = input.deltaTime < options.time;

        this.reset();

        if ((input.eventType & INPUT_START) && (this.count === 0)) {
            return this.failTimeout();
        }

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (validMovement && validTouchTime && validPointers) {
            if (input.eventType != INPUT_END) {
                return this.failTimeout();
            }

            var validInterval = this.pTime ? (input.timeStamp - this.pTime < options.interval) : true;
            var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;

            this.pTime = input.timeStamp;
            this.pCenter = input.center;

            if (!validMultiTap || !validInterval) {
                this.count = 1;
            } else {
                this.count += 1;
            }

            this._input = input;

            // if tap count matches we have recognized it,
            // else it has began recognizing...
            var tapCount = this.count % options.taps;
            if (tapCount === 0) {
                // no failing requirements, immediately trigger the tap event
                // or wait as long as the multitap interval to trigger
                if (!this.hasRequireFailures()) {
                    return STATE_RECOGNIZED;
                } else {
                    this._timer = setTimeoutContext(function() {
                        this.state = STATE_RECOGNIZED;
                        this.tryEmit();
                    }, options.interval, this);
                    return STATE_BEGAN;
                }
            }
        }
        return STATE_FAILED;
    },

    failTimeout: function() {
        this._timer = setTimeoutContext(function() {
            this.state = STATE_FAILED;
        }, this.options.interval, this);
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function() {
        if (this.state == STATE_RECOGNIZED) {
            this._input.tapCount = this.count;
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Simple way to create a manager with a default set of recognizers.
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Hammer(element, options) {
    options = options || {};
    options.recognizers = ifUndefined(options.recognizers, Hammer.defaults.preset);
    return new Manager(element, options);
}

/**
 * @const {string}
 */
Hammer.VERSION = '2.0.7';

/**
 * default settings
 * @namespace
 */
Hammer.defaults = {
    /**
     * set if DOM events are being triggered.
     * But this is slower and unused by simple implementations, so disabled by default.
     * @type {Boolean}
     * @default false
     */
    domEvents: false,

    /**
     * The value for the touchAction property/fallback.
     * When set to `compute` it will magically set the correct value based on the added recognizers.
     * @type {String}
     * @default compute
     */
    touchAction: TOUCH_ACTION_COMPUTE,

    /**
     * @type {Boolean}
     * @default true
     */
    enable: true,

    /**
     * EXPERIMENTAL FEATURE -- can be removed/changed
     * Change the parent input target element.
     * If Null, then it is being set the to main element.
     * @type {Null|EventTarget}
     * @default null
     */
    inputTarget: null,

    /**
     * force an input class
     * @type {Null|Function}
     * @default null
     */
    inputClass: null,

    /**
     * Default recognizer setup when calling `Hammer()`
     * When creating a new Manager these will be skipped.
     * @type {Array}
     */
    preset: [
        // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
        [RotateRecognizer, {enable: false}],
        [PinchRecognizer, {enable: false}, ['rotate']],
        [SwipeRecognizer, {direction: DIRECTION_HORIZONTAL}],
        [PanRecognizer, {direction: DIRECTION_HORIZONTAL}, ['swipe']],
        [TapRecognizer],
        [TapRecognizer, {event: 'doubletap', taps: 2}, ['tap']],
        [PressRecognizer]
    ],

    /**
     * Some CSS properties can be used to improve the working of Hammer.
     * Add them to this method and they will be set when creating a new Manager.
     * @namespace
     */
    cssProps: {
        /**
         * Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userSelect: 'none',

        /**
         * Disable the Windows Phone grippers when pressing an element.
         * @type {String}
         * @default 'none'
         */
        touchSelect: 'none',

        /**
         * Disables the default callout shown when you touch and hold a touch target.
         * On iOS, when you touch and hold a touch target such as a link, Safari displays
         * a callout containing information about the link. This property allows you to disable that callout.
         * @type {String}
         * @default 'none'
         */
        touchCallout: 'none',

        /**
         * Specifies whether zooming is enabled. Used by IE10>
         * @type {String}
         * @default 'none'
         */
        contentZooming: 'none',

        /**
         * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userDrag: 'none',

        /**
         * Overrides the highlight color shown when the user taps a link or a JavaScript
         * clickable element in iOS. This property obeys the alpha value, if specified.
         * @type {String}
         * @default 'rgba(0,0,0,0)'
         */
        tapHighlightColor: 'rgba(0,0,0,0)'
    }
};

var STOP = 1;
var FORCED_STOP = 2;

/**
 * Manager
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Manager(element, options) {
    this.options = assign({}, Hammer.defaults, options || {});

    this.options.inputTarget = this.options.inputTarget || element;

    this.handlers = {};
    this.session = {};
    this.recognizers = [];
    this.oldCssProps = {};

    this.element = element;
    this.input = createInputInstance(this);
    this.touchAction = new TouchAction(this, this.options.touchAction);

    toggleCssProps(this, true);

    each(this.options.recognizers, function(item) {
        var recognizer = this.add(new (item[0])(item[1]));
        item[2] && recognizer.recognizeWith(item[2]);
        item[3] && recognizer.requireFailure(item[3]);
    }, this);
}

Manager.prototype = {
    /**
     * set options
     * @param {Object} options
     * @returns {Manager}
     */
    set: function(options) {
        assign(this.options, options);

        // Options that need a little more setup
        if (options.touchAction) {
            this.touchAction.update();
        }
        if (options.inputTarget) {
            // Clean up existing event listeners and reinitialize
            this.input.destroy();
            this.input.target = options.inputTarget;
            this.input.init();
        }
        return this;
    },

    /**
     * stop recognizing for this session.
     * This session will be discarded, when a new [input]start event is fired.
     * When forced, the recognizer cycle is stopped immediately.
     * @param {Boolean} [force]
     */
    stop: function(force) {
        this.session.stopped = force ? FORCED_STOP : STOP;
    },

    /**
     * run the recognizers!
     * called by the inputHandler function on every movement of the pointers (touches)
     * it walks through all the recognizers and tries to detect the gesture that is being made
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        var session = this.session;
        if (session.stopped) {
            return;
        }

        // run the touch-action polyfill
        this.touchAction.preventDefaults(inputData);

        var recognizer;
        var recognizers = this.recognizers;

        // this holds the recognizer that is being recognized.
        // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
        // if no recognizer is detecting a thing, it is set to `null`
        var curRecognizer = session.curRecognizer;

        // reset when the last recognizer is recognized
        // or when we're in a new session
        if (!curRecognizer || (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)) {
            curRecognizer = session.curRecognizer = null;
        }

        var i = 0;
        while (i < recognizers.length) {
            recognizer = recognizers[i];

            // find out if we are allowed try to recognize the input for this one.
            // 1.   allow if the session is NOT forced stopped (see the .stop() method)
            // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
            //      that is being recognized.
            // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
            //      this can be setup with the `recognizeWith()` method on the recognizer.
            if (session.stopped !== FORCED_STOP && ( // 1
                    !curRecognizer || recognizer == curRecognizer || // 2
                    recognizer.canRecognizeWith(curRecognizer))) { // 3
                recognizer.recognize(inputData);
            } else {
                recognizer.reset();
            }

            // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
            // current active recognizer. but only if we don't already have an active recognizer
            if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
                curRecognizer = session.curRecognizer = recognizer;
            }
            i++;
        }
    },

    /**
     * get a recognizer by its event name.
     * @param {Recognizer|String} recognizer
     * @returns {Recognizer|Null}
     */
    get: function(recognizer) {
        if (recognizer instanceof Recognizer) {
            return recognizer;
        }

        var recognizers = this.recognizers;
        for (var i = 0; i < recognizers.length; i++) {
            if (recognizers[i].options.event == recognizer) {
                return recognizers[i];
            }
        }
        return null;
    },

    /**
     * add a recognizer to the manager
     * existing recognizers with the same event name will be removed
     * @param {Recognizer} recognizer
     * @returns {Recognizer|Manager}
     */
    add: function(recognizer) {
        if (invokeArrayArg(recognizer, 'add', this)) {
            return this;
        }

        // remove existing
        var existing = this.get(recognizer.options.event);
        if (existing) {
            this.remove(existing);
        }

        this.recognizers.push(recognizer);
        recognizer.manager = this;

        this.touchAction.update();
        return recognizer;
    },

    /**
     * remove a recognizer by name or instance
     * @param {Recognizer|String} recognizer
     * @returns {Manager}
     */
    remove: function(recognizer) {
        if (invokeArrayArg(recognizer, 'remove', this)) {
            return this;
        }

        recognizer = this.get(recognizer);

        // let's make sure this recognizer exists
        if (recognizer) {
            var recognizers = this.recognizers;
            var index = inArray(recognizers, recognizer);

            if (index !== -1) {
                recognizers.splice(index, 1);
                this.touchAction.update();
            }
        }

        return this;
    },

    /**
     * bind event
     * @param {String} events
     * @param {Function} handler
     * @returns {EventEmitter} this
     */
    on: function(events, handler) {
        if (events === undefined) {
            return;
        }
        if (handler === undefined) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            handlers[event] = handlers[event] || [];
            handlers[event].push(handler);
        });
        return this;
    },

    /**
     * unbind event, leave emit blank to remove all handlers
     * @param {String} events
     * @param {Function} [handler]
     * @returns {EventEmitter} this
     */
    off: function(events, handler) {
        if (events === undefined) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            if (!handler) {
                delete handlers[event];
            } else {
                handlers[event] && handlers[event].splice(inArray(handlers[event], handler), 1);
            }
        });
        return this;
    },

    /**
     * emit event to the listeners
     * @param {String} event
     * @param {Object} data
     */
    emit: function(event, data) {
        // we also want to trigger dom events
        if (this.options.domEvents) {
            triggerDomEvent(event, data);
        }

        // no handlers, so skip it all
        var handlers = this.handlers[event] && this.handlers[event].slice();
        if (!handlers || !handlers.length) {
            return;
        }

        data.type = event;
        data.preventDefault = function() {
            data.srcEvent.preventDefault();
        };

        var i = 0;
        while (i < handlers.length) {
            handlers[i](data);
            i++;
        }
    },

    /**
     * destroy the manager and unbinds all events
     * it doesn't unbind dom events, that is the user own responsibility
     */
    destroy: function() {
        this.element && toggleCssProps(this, false);

        this.handlers = {};
        this.session = {};
        this.input.destroy();
        this.element = null;
    }
};

/**
 * add/remove the css properties as defined in manager.options.cssProps
 * @param {Manager} manager
 * @param {Boolean} add
 */
function toggleCssProps(manager, add) {
    var element = manager.element;
    if (!element.style) {
        return;
    }
    var prop;
    each(manager.options.cssProps, function(value, name) {
        prop = prefixed(element.style, name);
        if (add) {
            manager.oldCssProps[prop] = element.style[prop];
            element.style[prop] = value;
        } else {
            element.style[prop] = manager.oldCssProps[prop] || '';
        }
    });
    if (!add) {
        manager.oldCssProps = {};
    }
}

/**
 * trigger dom event
 * @param {String} event
 * @param {Object} data
 */
function triggerDomEvent(event, data) {
    var gestureEvent = document.createEvent('Event');
    gestureEvent.initEvent(event, true, true);
    gestureEvent.gesture = data;
    data.target.dispatchEvent(gestureEvent);
}

assign(Hammer, {
    INPUT_START: INPUT_START,
    INPUT_MOVE: INPUT_MOVE,
    INPUT_END: INPUT_END,
    INPUT_CANCEL: INPUT_CANCEL,

    STATE_POSSIBLE: STATE_POSSIBLE,
    STATE_BEGAN: STATE_BEGAN,
    STATE_CHANGED: STATE_CHANGED,
    STATE_ENDED: STATE_ENDED,
    STATE_RECOGNIZED: STATE_RECOGNIZED,
    STATE_CANCELLED: STATE_CANCELLED,
    STATE_FAILED: STATE_FAILED,

    DIRECTION_NONE: DIRECTION_NONE,
    DIRECTION_LEFT: DIRECTION_LEFT,
    DIRECTION_RIGHT: DIRECTION_RIGHT,
    DIRECTION_UP: DIRECTION_UP,
    DIRECTION_DOWN: DIRECTION_DOWN,
    DIRECTION_HORIZONTAL: DIRECTION_HORIZONTAL,
    DIRECTION_VERTICAL: DIRECTION_VERTICAL,
    DIRECTION_ALL: DIRECTION_ALL,

    Manager: Manager,
    Input: Input,
    TouchAction: TouchAction,

    TouchInput: TouchInput,
    MouseInput: MouseInput,
    PointerEventInput: PointerEventInput,
    TouchMouseInput: TouchMouseInput,
    SingleTouchInput: SingleTouchInput,

    Recognizer: Recognizer,
    AttrRecognizer: AttrRecognizer,
    Tap: TapRecognizer,
    Pan: PanRecognizer,
    Swipe: SwipeRecognizer,
    Pinch: PinchRecognizer,
    Rotate: RotateRecognizer,
    Press: PressRecognizer,

    on: addEventListeners,
    off: removeEventListeners,
    each: each,
    merge: merge,
    extend: extend,
    assign: assign,
    inherit: inherit,
    bindFn: bindFn,
    prefixed: prefixed
});

// this prevents errors when Hammer is loaded in the presence of an AMD
//  style loader but by script tag, not by the loader.
var freeGlobal = (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {})); // jshint ignore:line
freeGlobal.Hammer = Hammer;

if (typeof define === 'function' && define.amd) {
    define(function() {
        return Hammer;
    });
} else if (typeof module != 'undefined' && module.exports) {
    module.exports = Hammer;
} else {
    window[exportName] = Hammer;
}

})(window, document, 'Hammer');
    



//add_hammer_js函数结束的大括号 
}


