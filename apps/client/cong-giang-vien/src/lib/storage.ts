const STORAGE_KEY = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
}

const setStorage = (key: keyof typeof STORAGE_KEY, value: string) => {
  localStorage.setItem(key, value)
}

const getStorage = (key: keyof typeof STORAGE_KEY) => {
  return localStorage.getItem(key)
}

const removeStorage = (key: keyof typeof STORAGE_KEY) => {
  localStorage.removeItem(key)
}

export { setStorage, getStorage, removeStorage }
