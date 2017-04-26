/**
 * Created by hxw on 2017/3/28.
 */
var express=require('express');
var router=express.Router();
var User=require('../models/user');
var Category=require('../models/category');
var Content=require('../models/content');


router.use(function (req,res,next) {
    if (!req.userInfo.isAdmin){
        //如果当前登录用户不是管理员
        res.send('对不起，只有管理员才可以进入后台管理');
        return;
    }
    next();
})


/**
 * 首页
 * */
router.get('/',function (req,res,next) {
    res.render('admin/index',{
        userInfo:req.userInfo
    });
});

/**
 * 用户管理
 * */
router.get('/user',function (req,res,next) {

    /**
     *
     * 从数据库中读取所有的用户数据
     *
     * limit(number) 限制获取数据的条数
     * skip(2)忽略数据的条数
     *
     * 每页显示两条
     * 1:1-2 skip(0) -> (当前页-1)*limit
     * 2:3-4 skip(2)
     * */
    var page=Number(req.query.page || 1);
    var limit=5;
    var pages=0;
    User.count().then(function (count) {
        // console.log(count);
        //计算总页数
        pages=Math.ceil(count/limit);//向上取整
        //取值不超过pages
        page=Math.min(page,pages);
        //取值不小于1
        page=Math.max(page,1)
        var skip=(page-1)*limit;
        User.find().limit(limit).skip(skip).then(function (users) {
            console.log(users);
            res.render('admin/user_index',{
                userInfo:req.userInfo,
                users:users,
                count:count,
                page:page,
                pages:pages,
                limit:limit
            });
        })
    })




})

/*
* 分类首页
* */
router.get('/category',function (req,res) {
    var page=Number(req.query.page || 1);
    var limit=5;
    var pages=0;
    Category.count().then(function (count) {
        // console.log(count);
        //计算总页数
        pages=Math.ceil(count/limit);//向上取整
        //取值不超过pages
        page=Math.min(page,pages);
        //取值不小于1
        page=Math.max(page,1)
        var skip=(page-1)*limit;

        /**
         * 1:升序
         * -1:降序
         * _id里面包含了一个创建的时间戳，所有越后面越大，我们要让后面的排在前面，就要采用降序排列
         * */
        Category.find().sort({_id:-1}).limit(limit).skip(skip).then(function (categories) {
            res.render('admin/category_index',{
                userInfo:req.userInfo,
                categories:categories,
                count:count,
                page:page,
                pages:pages,
                limit:limit

            })
        })
    })
})
/*
 * 分类添加
 * */
router.get('/category/add',function (req,res) {
    res.render('admin/category_add',{

    })
})

/*
 * 分类的保存
 * */
router.post('/category/add',function (req,res) {
  var name=req.body.name || '';
    if(name==''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'名称不能为空！！！！！'
        });
        return;
    }
    //数据库中是否存在同名分类信息
    Category.findOne({
        name:name
    }).then(function (rs) {
        if(rs){
            //数据库中存在同名的分类了
            res.render('admin/error',{
                userInfo:req.userInfo,
                message:'分类已经存在'
            })
            return Promise.reject();
        }else {
            //数据库中不存在该分类，可以保存
            return new Category({
                name:name
            }).save();
        }
    }).then(function (newCategory) {
        res.render('admin/success',{
            userInfo:req.userInfo,
            message:'分类保存成功！',
            url:'/admin/category'
        });
    })
})
/*
 * 分类修改
 * */
router.get('/category/edit',function (req,res) {
    var id = req.query.id || '';
    // console.log(id);
    Category.findOne({
        _id:id
    }).then(function (category) {
       if(!category){
           //分类不存在
           res.render('admin/error',{
               userInfo:req.userInfo,
               message:'分类信息不存在'
           })
           return Promise.reject();
       } else{
           //分类存在
           // console.log(category);
           res.render('admin/category_edit',{
               userInfo:req.userInfo,
               category:category
           });
       }
    })
})
/*
 * 分类修改保存
 * */
router.post('/category/edit',function (req,res) {
    var id=req.query.id || '';
    var name=req.body.name || '';
    // console.log(id);
    // console.log(name);
    //获取要修改的分类信息
    Category.findOne({
        _id:id
    }).then(function (category) {
        if (!category){
            res.render('admin/error',{
                userInfo:req.userInfo,
                message:'分类信息不存在！'
            });
            return Promise.reject();
        }else{
            //当用户没有做任何修改提交
            if(name==category.name){
                res.render('admin/success',{
                    userInfo:req.userInfo,
                    message:'修改成功！',
                    url:'/admin/category'
                })
                return Promise.reject();
            }else{
                //要修改的分类名称是否已经在数据库存在
                return Category.findOne({
                    _id:{$ne:id},
                    name:name
                })
            }
        }
    }).then(function (someCategory) {
        if(someCategory){
            res.render('admin/error',{
                userInfo:req.userInfo,
                message:'数据库中已经存在同名分类'
            })
            return Promise.reject();
        }else{
            // console.log(111);
            // console.log(name);
            return Category.update({
                _id:id
            },{
                name:name
            });
        }
    }).then(function () {
        res.render('admin/success',{
            userInfo:req.userInfo,
            message:'修改成功！',
            url:'/admin/category'
        })
    })





})





/*
 * 分类删除
 * */
router.get('/category/delete',function (req,res) {
    var id= req.query.id || '';
    Category.remove({
        _id:id
    }).then(function (category) {
        res.render('admin/success',{
            userInfo:req.userInfo,
            message:'删除成功！',
            url:'/admin/category'
        })
    })
})

/*
 *内容首页
 * */
router.get('/content',function (req,res) {
    var page=Number(req.query.page || 1);
    var limit=5;
    var pages=0;
    Content.count().then(function (count) {
        // console.log(count);
        //计算总页数
        pages=Math.ceil(count/limit);//向上取整
        //取值不超过pages
        page=Math.min(page,pages);
        //取值不小于1
        page=Math.max(page,1)
        var skip=(page-1)*limit;

        /**
         * 1:升序
         * -1:降序
         * _id里面包含了一个创建的时间戳，所有越后面越大，我们要让后面的排在前面，就要采用降序排列
         * */
        Content.find().sort({_id:-1}).limit(limit).skip(skip).populate(['category','user']).then(function (contents) {
            // console.log(contents);
            res.render('admin/content_index',{
                userInfo:req.userInfo,
                contents:contents,
                count:count,
                page:page,
                pages:pages,
                limit:limit

            })
        })
    })
})

/*
 *内容添加
 * */
router.get('/content/add',function (req,res) {
    //读取所有分类信息
    Category.find().then(function (categories) {
        res.render('admin/content_add',{
            userInfo:req.userInfo,
            categories:categories
        })
    })


})
/*
 *内容添加保存
 * */
router.post('/content/add',function (req,res) {
    console.log(req);
    if(req.body.category==''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'内容分类不能为空！！！！！'
        });
        return;
    }
    if(req.body.title==''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'内容标题不能为空！！！！！'
        });
        return;
    }
    new Content({
        category:req.body.category,
        title:req.body.title,
        user:req.userInfo._id.toString(),
        description:req.body.description,
        content:req.body.content
    }).save().then(function (rs) {
        res.render('admin/success',{
            userInfo:req.userInfo,
            message:'内容保存成功',
            url:'/admin/content'
        })
    })
})
/*
* 内容修改
* */
router.get('/content/edit',function (req,res) {
    var id=req.query.id || '';
    var categories=[];
    Category.find().sort({_id:1}).then(function (rs) {
        categories=rs;
        return Content.findOne({
            _id:id
        }).populate('category');
    }).then(function (content) {
        // console.log(content);
        if(!content){
            res.render('admin/error',{
                userInfo:req.userInfo,
                message:'指定内容不存在'
            });
            return Promise.reject();
        }else{
            res.render('admin/content_edit',{
                userInfo:req.userInfo,
                content:content,
                categories:categories
            })
        }
    })
})
/*
 * 内容修改保存
 * */
router.post('/content/edit',function (req,res) {
    var id=req.query.id || '';

    if(req.body.category==''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'内容分类不能为空！！！！！'
        });
        return;
    }
    if(req.body.title==''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'内容标题不能为空！！！！！'
        });
        return;
    }
    Content.update({
        _id:id
    },{
        category:req.body.category,
        title:req.body.title,
        description:req.body.description,
        content:req.body.content
    }).then(function () {
        res.render('admin/success',{
            userInfo:req.userInfo,
            message:'内容修改成功',
            url:'/admin/content/edit?id='+id
        })
    })

})
/*
 * 内容删除
 * */
router.get('/content/delete',function (req,res) {
    var id=req.query.id || '';
    Content.remove({
        _id:id
    }).then(function () {
        res.render('admin/success',{
            userInfo:req.userInfo,
            message:'删除成功',
            url:'/admin/content'
        })
    })
})


module.exports=router;