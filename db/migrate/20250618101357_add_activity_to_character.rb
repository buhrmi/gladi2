class AddActivityToCharacter < ActiveRecord::Migration[8.0]
  def change
    add_column :characters, :activity, :string
  end
end
