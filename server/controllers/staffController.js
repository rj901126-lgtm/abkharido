import User from '../models/User.js';

// @desc    Get all admin staff
// @route   GET /api/staff
// @access  Private/SuperAdmin
export const getStaff = async (req, res, next) => {
  try {
    const staffRoles = ['admin', 'super_admin', 'support_agent', 'catalog_manager'];
    const staff = await User.find({ role: { $in: staffRoles } }).select('-password').lean();
    res.json(staff);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new staff member
// @route   POST /api/staff
// @access  Private/SuperAdmin
export const addStaff = async (req, res, next) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    const staffRoles = ['admin', 'super_admin', 'support_agent', 'catalog_manager'];
    if (!staffRoles.includes(role)) {
      res.status(400);
      throw new Error('Invalid staff role');
    }

    const userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const staff = await User.create({
      username,
      email,
      password,
      fullName,
      role
    });

    res.status(201).json({
      _id: staff._id,
      username: staff.username,
      email: staff.email,
      role: staff.role
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update staff role or suspend
// @route   PUT /api/staff/:id
// @access  Private/SuperAdmin
export const updateStaff = async (req, res, next) => {
  try {
    const { role, status } = req.body;
    const staff = await User.findById(req.params.id);

    if (staff) {
      // Prevent modifying super_admin by other super_admins (except self or master token)
      if (staff.role === 'super_admin' && req.user._id.toString() !== 'master_admin_legacy' && req.user._id.toString() !== staff._id.toString()) {
         res.status(403);
         throw new Error('Cannot modify another Super Admin');
      }

      if (role) staff.role = role;
      if (status) staff.status = status;

      const updatedStaff = await staff.save();
      res.json({
        _id: updatedStaff._id,
        username: updatedStaff.username,
        role: updatedStaff.role,
        status: updatedStaff.status
      });
    } else {
      res.status(404);
      throw new Error('Staff not found');
    }
  } catch (error) {
    next(error);
  }
};
