/* eslint-disable react/react-in-jsx-scope */
import Logo from '/icon.svg'
import '../Style/main.css'
import { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'

function Nav() {
    const [modalOpen, setModalOpen] = useState(false);
    return (
        <div>
            <header className="absolute w-full z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-20 p-5 mx-10">
                        <div className="shrink-0 mr-4">
                            <a href="/" className="block" aria-label="Cruip">
                                <img src={Logo} className="logo nav-logo" alt="Vite logo" />
                            </a>
                        </div>

                        {/* <div>
                            <a href="/" className="tranparent-btn">
                                ทดสอบ
                            </a>
                            <button onClick={() => { setModalOpen(true) }} href="/signup" className="defalut-btn">
                                อัปโหลด!
                            </button>
                        </div> */}
                    </div>
                </div>
            </header>

            <Transition show={modalOpen} as={Fragment}>
                <Dialog onClose={() => setModalOpen(false)}>
                    <Transition.Child
                        className="fixed inset-0 z-[99999] bg-black bg-opacity-75 transition-opacity"
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition ease-out duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        aria-hidden="true"
                    />

                    <Transition.Child
                        className="fixed inset-0 z-[99999] overflow-hidden flex items-center justify-center transform px-4 sm:px-6"
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ttransition ease-out duration-200"
                        leaveFrom="oopacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <div className="max-w-6xl mx-auto h-full flex items-center">
                            <Dialog.Panel className="w-full max-h-full aspect-video bg-black overflow-hidden">
                                <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                                            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                                    <div className="sm:flex sm:items-start">
                                                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                                            </svg>
                                                        </div>
                                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                                            <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">Deactivate account</h3>
                                                            <div className="mt-2">
                                                                <p className="text-sm text-gray-500">Are you sure you want to deactivate your account? All of your data will be permanently removed. This action cannot be undone.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                                    <button type="button" className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto">
                                                        Deactivate
                                                    </button>
                                                    <button type="button" onClick={() => setModalOpen(false)} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </Transition.Child>
                </Dialog>
            </Transition>
        </div>
    )
}

export default Nav