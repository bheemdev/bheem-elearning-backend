const jwt = require('jsonwebtoken')
const config = require('config')
const _ = require('lodash')
const { flatten } = require('../../utils/services')
const Manifest = require('./manifest')
const User = require('../user/Model')
const entity = Manifest.entity
const EntityModel = require('./Model')
const TokoTokoOnlineModel = require('../toko_toko_online/Model')
const fetchAllData = async (args, context) => {
  try {
    const filter = {}
    const { accesstoken } = context.req.headers
    const bodyAt = await jwt.verify(accesstoken, config.get('privateKey'))
    const { user_id: userId } = bodyAt
    // if (!_.isEmpty(args.string_to_search)) {
    //   filter.$and = []
    //   filter.$and.push({
    //     $or: [
    //       { title: { $regex: args.string_to_search, $options: 'i' } },
    //       { code: { $regex: args.string_to_search, $options: 'i' } },
    //       { description: { $regex: args.string_to_search, $options: 'i' } }
    //     ]
    //   })
    // }
    const result = await EntityModel.find(filter)
      .sort({ updated_at: 'desc' })
      .skip(args.page_index * args.page_size)
      .limit(args.page_size)
      .populate({ path: 'toko_id' })
      .populate({ path: 'user_id' })
      .populate({ path: 'role_id' })
      .populate({ path: 'created_by' })
      .populate({ path: 'updated_by' })
    const count = await EntityModel.countDocuments(filter)
    const pageCount = await Math.ceil(count / args.page_size)
    return { status: 200, success: 'Successfully get all Data', list_data: result, count, page_count: pageCount }
  } catch (err) {
    console.log('err=> ', err)
    return { status: 400, error: err.message }
  }
}
const getAllDataByTokoId = async (args, context) => {
  try {
    const filter = { toko_id: args.toko_id }
    // const { accesstoken } = context.req.headers
    // const bodyAt = await jwt.verify(accesstoken, config.get('privateKey'))
    // const { user_id: userId } = bodyAt
    if (!_.isEmpty(args.string_to_search)) {
      // filter.$and = []
      // filter.$and.push({
      //   $or: [
      //     { title: { $regex: args.string_to_search, $options: 'i' } },
      //     { code: { $regex: args.string_to_search, $options: 'i' } },
      //     { description: { $regex: args.string_to_search, $options: 'i' } }
      //   ]
      // })
    }
    const result = await EntityModel.find(filter)
      .sort({ updated_at: 'desc' })
      .skip(args.page_index * args.page_size)
      .limit(args.page_size)
      .populate({ path: 'user_id' })
      .populate({ path: 'toko_id' })
      .populate({ path: 'role_id' })
      .populate({ path: 'created_by' })
      .populate({ path: 'updated_by' })
    const count = await EntityModel.countDocuments(filter)
    const pageCount = await Math.ceil(count / args.page_size)
    return { status: 200, success: 'Successfully get all Data', list_data: result, count, page_count: pageCount }
  } catch (err) {
    console.log('err=> ', err)
    return { status: 400, error: err.message }
  }
}
const fetchDetailData = async (args, context) => {
  try {
    const { accesstoken } = context.req.headers
    const bodyAt = await jwt.verify(accesstoken, config.get('privateKey'))
    const { user_id: userId } = bodyAt
    const result = await EntityModel.findOne({ _id: args.id })
      .populate({ path: 'user_id' })
      .populate({ path: 'role_id' })
      .populate({ path: 'toko_id' })
      .populate({ path: 'created_by' })
      .populate({ path: 'updated_by' })
    return { status: 200, success: 'Successfully get Data', data_detail: result }
  } catch (err) {
    return { status: 400, error: err.message }
  }
}
const doCreateData = async (args, context) => {
  const session = await EntityModel.db.startSession()
  session.startTransaction()
  try {
    const opts = { session }
    const now = Date.now()
    const { accesstoken } = context.req.headers
    const bodyAt = await jwt.verify(accesstoken, config.get('privateKey'))
    const { user_id: userId } = bodyAt
    const userDetail = await User.findById(userId)
    const tokoDetail = await TokoTokoOnlineModel.findById(args.toko_id)
    if (!tokoDetail) throw new Error('invalid toko id')
    const teamMemberDetail = await User.findOne({ email: args.email })
    if (!teamMemberDetail) throw new Error('invalid team email')

    const data = {}
    data.user_id = teamMemberDetail._id
    data.toko_id = tokoDetail._id
    // default team member role: merchant toko online team member
    data.role_id = '5f355b3a072c38a95aa39536'
    data.created_by = userDetail._id
    data.updated_by = userDetail._id
    data.created_at = now
    data.updated_at = now
    const createResponse = (await EntityModel.create([data], opts))[0]
    console.log('createResponse====>', createResponse)
    await session.commitTransaction()
    session.endSession()
    return { status: 200, success: 'Successfully save Data', detail_data: createResponse }
  } catch (err) {
    console.log('errorrr====>', err)
    await session.abortTransaction()
    session.endSession()
    return { status: 400, error: err.message }
  }
}
const doUpdateData = async (args, context) => {
  try {
    const now = Date.now()
    const { accesstoken } = context.req.headers
    const bodyAt = await jwt.verify(accesstoken, config.get('privateKey'))
    const { user_id: userId } = bodyAt
    const userDetail = await User.findById(userId)
    // const dataDetail = await EntityModel.findById(args._id)
    const data = args
    // data.created_by = userDetail._id
    data.updated_by = userDetail._id
    // data.created_at = now
    data.updated_at = now
    // data.category_id = flatten([...dataDetail.category_id, ...args.category_id])
    console.log('update=> ', data)
    return { status: 200, success: 'Successfully save Data', detail_data: await EntityModel.findOneAndUpdate({ _id: args._id }, data).populate({ path: 'created_by' }).populate({ path: 'updated_by' }) }
  } catch (err) {
    console.log('errorrr====>', err)
    return { status: 400, error: err.message }
  }
}
const doDeleteData = async (args, context) => {
  const session = await EntityModel.db.startSession()
  session.startTransaction()
  const opts = { session }
  try {
    const { accesstoken } = context.req.headers
    const bodyAt = await jwt.verify(accesstoken, config.get('privateKey'))
    const { user_id: userId } = bodyAt
    console.log('delete invoked args=', args)
    // delete privilege
    const dataDetail = await EntityModel.findById(args._id).session(session)
    await dataDetail.deleteOne()
    await session.commitTransaction()
    session.endSession()
    return { status: 200, success: 'Successfully delete Data', detail_data: {} }
  } catch (err) {
    await session.abortTransaction()
    session.endSession()
    console.log('errorrr====>', err)
    return { status: 400, error: err.message }
  }
}

module.exports = {
  ['fetchAll' + entity + 's']: fetchAllData,
  ['fetchDetail' + entity]: fetchDetailData,
  ['doCreate' + entity]: doCreateData,
  ['doUpdate' + entity]: doUpdateData,
  ['doDelete' + entity]: doDeleteData,
  getAllDataByTokoId
}
