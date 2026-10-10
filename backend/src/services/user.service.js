export const updateProfile = async (user, updates) => {
  user.set(updates);
  await user.save();
  return user;
};
