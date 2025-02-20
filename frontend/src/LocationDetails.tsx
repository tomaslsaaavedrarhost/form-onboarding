                    </div>

                    <div>
                      <SectionTitle>Corkage Policy</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify if your establishment allows customers to bring their own wine and any associated fees
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Does your establishment allow corkage?</span>
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.corkage.allowed`}
                                checked={values.locationDetails[index].corkage.allowed === true}
                                onChange={() => setFieldValue(`locationDetails.${index}.corkage.allowed`, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.corkage.allowed`}
                                checked={values.locationDetails[index].corkage.allowed === false}
                                onChange={() => setFieldValue(`locationDetails.${index}.corkage.allowed`, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        {values.locationDetails[index].corkage.allowed && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Corkage Fee
                            </label>
                            <p className="mt-1 text-sm text-gray-500">
                              Specify the fee charged per bottle
                            </p>
                            <Field
                              type="text"
                              name={`locationDetails.${index}.corkage.fee`}
                              placeholder="e.g., $25 per bottle"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Special Discounts and Happy Hours</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Configure any ongoing specials, discounts, or Happy Hours for specific groups
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Do you offer any special discounts or Happy Hours?</span>
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.specialDiscounts.hasDiscounts`}
                                checked={values.locationDetails[index].specialDiscounts.hasDiscounts === true}
                                onChange={() => setFieldValue(`locationDetails.${index}.specialDiscounts.hasDiscounts`, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.specialDiscounts.hasDiscounts`}
                                checked={values.locationDetails[index].specialDiscounts.hasDiscounts === false}
                                onChange={() => setFieldValue(`locationDetails.${index}.specialDiscounts.hasDiscounts`, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        {values.locationDetails[index].specialDiscounts.hasDiscounts && (
                          <div>
                            <FieldArray name={`locationDetails.${index}.specialDiscounts.details`}>
                              {({ push, remove }) => (
                                <div className="space-y-2">
                                  {values.locationDetails[index].specialDiscounts.details?.map((detail, detailIndex) => (
                                    <div key={detailIndex} className="flex gap-2">
                                      <Field
                                        type="text"
                                        name={`locationDetails.${index}.specialDiscounts.details.${detailIndex}`}
                                        placeholder="e.g., 10% off for military, Happy Hour 4-6 PM"
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => remove(detailIndex)}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => push('')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                  >
                                    Add Discount/Special
                                  </button>
                                </div>
                              )}
                            </FieldArray>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Holiday Events</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify any special events or preparations for key holiday dates
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Do you have special holiday events or preparations?</span>
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.holidayEvents.hasEvents`}
                                checked={values.locationDetails[index].holidayEvents.hasEvents === true}
                                onChange={() => setFieldValue(`locationDetails.${index}.holidayEvents.hasEvents`, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.holidayEvents.hasEvents`}
                                checked={values.locationDetails[index].holidayEvents.hasEvents === false}
                                onChange={() => setFieldValue(`locationDetails.${index}.holidayEvents.hasEvents`, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        {values.locationDetails[index].holidayEvents.hasEvents && (
                          <div>
                            <FieldArray name={`locationDetails.${index}.holidayEvents.events`}>
                              {({ push, remove }) => (
                                <div className="space-y-4">
                                  {values.locationDetails[index].holidayEvents.events?.map((event, eventIndex) => (
                                    <div key={eventIndex} className="grid grid-cols-1 gap-4 p-4 border border-gray-200 rounded-md">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">Event Date</label>
                                        <Field
                                          type="date"
                                          name={`locationDetails.${index}.holidayEvents.events.${eventIndex}.date`}
                                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">Event Name</label>
                                        <Field
                                          type="text"
                                          name={`locationDetails.${index}.holidayEvents.events.${eventIndex}.name`}
                                          placeholder="e.g., Christmas Eve Dinner"
                                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">Event Description</label>
                                        <Field
                                          as="textarea"
                                          name={`locationDetails.${index}.holidayEvents.events.${eventIndex}.description`}
                                          placeholder="Describe the special event or preparations"
                                          rows={3}
                                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => remove(eventIndex)}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                                      >
                                        Remove Event
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => push({ date: '', name: '', description: '' })}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                  >
                                    Add Holiday Event
                                  </button>
                                </div>
                              )}
                            </FieldArray>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Special Events</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify any regular special events like wine tastings, karaoke nights, etc.
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Do you host special events?</span>
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.specialEvents.hasEvents`}
                                checked={values.locationDetails[index].specialEvents.hasEvents === true}
                                onChange={() => setFieldValue(`locationDetails.${index}.specialEvents.hasEvents`, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.specialEvents.hasEvents`}
                                checked={values.locationDetails[index].specialEvents.hasEvents === false}
                                onChange={() => setFieldValue(`locationDetails.${index}.specialEvents.hasEvents`, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        {values.locationDetails[index].specialEvents.hasEvents && (
                          <div>
                            <FieldArray name={`locationDetails.${index}.specialEvents.events`}>
                              {({ push, remove }) => (
                                <div className="space-y-4">
                                  {values.locationDetails[index].specialEvents.events?.map((event, eventIndex) => (
                                    <div key={eventIndex} className="grid grid-cols-1 gap-4 p-4 border border-gray-200 rounded-md">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">Event Type</label>
                                        <Field
                                          type="text"
                                          name={`locationDetails.${index}.specialEvents.events.${eventIndex}.type`}
                                          placeholder="e.g., Wine Tasting, Karaoke Night"
                                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">Frequency</label>
                                        <Field
                                          type="text"
                                          name={`locationDetails.${index}.specialEvents.events.${eventIndex}.frequency`}
                                          placeholder="e.g., Every Thursday, First Friday of the month"
                                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <Field
                                          as="textarea"
                                          name={`locationDetails.${index}.specialEvents.events.${eventIndex}.description`}
                                          placeholder="Describe the event details"
                                          rows={3}
                                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => remove(eventIndex)}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                                      >
                                        Remove Event
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => push({ type: '', frequency: '', description: '' })}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                  >
                                    Add Special Event
                                  </button>
                                </div>
                              )}
                            </FieldArray>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Social Media Updates</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify if you use Instagram to keep your audience updated about special events
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Do you post special event updates on Instagram?</span>
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.socialMedia.instagram.usesInstagram`}
                                checked={values.locationDetails[index].socialMedia.instagram.usesInstagram === true}
                                onChange={() => setFieldValue(`locationDetails.${index}.socialMedia.instagram.usesInstagram`, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.socialMedia.instagram.usesInstagram`}
                                checked={values.locationDetails[index].socialMedia.instagram.usesInstagram === false}
                                onChange={() => setFieldValue(`locationDetails.${index}.socialMedia.instagram.usesInstagram`, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        {values.locationDetails[index].socialMedia.instagram.usesInstagram && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Instagram Handle
                            </label>
                            <Field
                              type="text"
                              name={`locationDetails.${index}.socialMedia.instagram.handle`}
                              placeholder="@yourusername"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Birthday Celebrations</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify if you allow birthday celebrations and any special arrangements or restrictions
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Do you allow birthday celebrations?</span>
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.birthdayCelebrations.allowed`}
                                checked={values.locationDetails[index].birthdayCelebrations.allowed === true}
                                onChange={() => setFieldValue(`locationDetails.${index}.birthdayCelebrations.allowed`, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.birthdayCelebrations.allowed`}
                                checked={values.locationDetails[index].birthdayCelebrations.allowed === false}
                                onChange={() => setFieldValue(`locationDetails.${index}.birthdayCelebrations.allowed`, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        {values.locationDetails[index].birthdayCelebrations.allowed && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Celebration Details
                              </label>
                              <Field
                                as="textarea"
                                name={`locationDetails.${index}.birthdayCelebrations.details`}
                                placeholder="Describe any special arrangements, complimentary items, or services for birthday celebrations"
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Restrictions
                              </label>
                              <FieldArray name={`locationDetails.${index}.birthdayCelebrations.restrictions`}>
                                {({ push, remove }) => (
                                  <div className="space-y-2">
                                    {values.locationDetails[index].birthdayCelebrations.restrictions?.map((restriction, restrictionIndex) => (
                                      <div key={restrictionIndex} className="flex gap-2">
                                        <Field
                                          type="text"
                                          name={`locationDetails.${index}.birthdayCelebrations.restrictions.${restrictionIndex}`}
                                          placeholder="e.g., Maximum party size, advance notice required"
                                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => remove(restrictionIndex)}
                                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => push('')}
                                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                    >
                                      Add Restriction
                                    </button>
                                  </div>
                                )}
                              </FieldArray>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Dress Code</SectionTitle>
                      <p className="mt-1 mb-4 text-sm text-gray-500">
                        Specify if your establishment has a dress code that guests are expected to follow
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Does this location have a dress code?</span>
                          <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.dressCode.hasDressCode`}
                                checked={values.locationDetails[index].dressCode.hasDressCode === true}
                                onChange={() => setFieldValue(`locationDetails.${index}.dressCode.hasDressCode`, true)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`locationDetails.${index}.dressCode.hasDressCode`}
                                checked={values.locationDetails[index].dressCode.hasDressCode === false}
                                onChange={() => setFieldValue(`locationDetails.${index}.dressCode.hasDressCode`, false)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        {values.locationDetails[index].dressCode.hasDressCode && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Dress Code Details
                              </label>
                              <Field
                                as="textarea"
                                name={`locationDetails.${index}.dressCode.details`}
                                placeholder="Describe the dress code requirements (e.g., Business casual, no athletic wear)"
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Exceptions or Special Circumstances
                              </label>
                              <FieldArray name={`locationDetails.${index}.dressCode.exceptions`}>
                                {({ push, remove }) => (
                                  <div className="space-y-2">
                                    {values.locationDetails[index].dressCode.exceptions?.map((exception, exceptionIndex) => (
                                      <div key={exceptionIndex} className="flex gap-2">
                                        <Field
                                          type="text"
                                          name={`locationDetails.${index}.dressCode.exceptions.${exceptionIndex}`}
                                          placeholder="e.g., Relaxed dress code for Sunday brunch"
                                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => remove(exceptionIndex)}
                                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => push('')}
                                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                    >
                                      Add Exception
                                    </button>
                                  </div>
                                )}
                              </FieldArray>
                            </div>
                          </div>
                        )}
                      </div>
                    </div> 