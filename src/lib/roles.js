export const ROLES = {
  USER:        'user',
  ADMIN:       'admin',
  SUPER_ADMIN: 'super_admin',
};

export const ROLE_LABELS = {
  user:        'Interna',
  admin:       'Licenciada',
  super_admin: 'Super Admin',
};

/** Puede gestionar usuarios y horario */
export const canManage = (role) =>
  [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role);

/** Puede ver y editar notas clínicas */
export const canEditClinical = (role) =>
  [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role);

/** Puede acceder al panel de administración */
export const isAdminRole = (role) =>
  [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role);
