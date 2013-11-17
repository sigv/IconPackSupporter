package org.signalv.iconpack;

import java.util.ArrayList;

import android.app.Activity;
import android.content.Intent;
import android.content.Intent.ShortcutIconResource;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.BaseAdapter;
import android.widget.GridView;
import android.widget.ImageView;
import android.widget.RelativeLayout;

import com.example.iconpack.R;

/** The main activity. */
public class MActivity extends Activity implements OnItemClickListener {

	private class IconAdapter extends BaseAdapter {

		private final ArrayList<Integer> icons = new ArrayList<Integer>();

		/** Constructs an icon Adapter. */
		public IconAdapter() {
			super();

			final String pkg = getApplication().getPackageName();
			for (String s : getResources().getStringArray(R.array.icon_pack)) {
				int resID = getResources().getIdentifier(s, "drawable", pkg);
				if (resID != 0)
					icons.add(resID);
			}
		}

		@Override
		public int getCount() {
			return icons.size();
		}

		@Override
		public Object getItem(int pos) {
			return BitmapFactory.decodeResource(getResources(), icons.get(pos));
		}

		@Override
		public long getItemId(int pos) {
			return icons.get(pos);
		}

		private ShortcutIconResource getResource(int pos) {
			return ShortcutIconResource.fromContext(MActivity.this,
					icons.get(pos));
		}

		@Override
		public View getView(int position, View convertView, ViewGroup parent) {
			ImageView imageView;
			if (convertView != null) {
				imageView = (ImageView) convertView;
			} else {
				int s = getResources().getDimensionPixelSize(
						android.R.dimen.app_icon_size);

				imageView = new ImageView(MActivity.this);
				imageView.setLayoutParams(new GridView.LayoutParams(s, s));
			}
			imageView.setImageResource(icons.get(position));
			return imageView;
		}

	}

	private static final String ADW_ACTION_PICK_ICON = "org.adw.launcher.icons.ACTION_PICK_ICON";

	private static final String ADW_ACTION_PICK_RES = "org.adw.launcher.icons.ACTION_PICK_ICON_RESOURCE";

	private boolean iconPickerMode = false;

	private boolean resPickerMode = false;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		if (getIntent().getAction().equals(ADW_ACTION_PICK_ICON))
			iconPickerMode = true;
		if (getIntent().hasExtra(ADW_ACTION_PICK_RES))
			resPickerMode = true;

		int s = getResources().getDimensionPixelSize(
				android.R.dimen.app_icon_size);

		RelativeLayout rl = new RelativeLayout(this);
		rl.setLayoutParams(new RelativeLayout.LayoutParams(
				LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

		GridView g = new GridView(this);
		g.setLayoutParams(new GridView.LayoutParams(LayoutParams.MATCH_PARENT,
				LayoutParams.MATCH_PARENT));
		g.setStretchMode(GridView.STRETCH_SPACING);
		g.setNumColumns(GridView.AUTO_FIT);
		g.setColumnWidth(s);
		g.setVerticalSpacing(s / 3);
		g.setHorizontalSpacing(s / 3);
		g.setPadding(s / 6, s / 6, s / 6, s / 6);
		g.setClipToPadding(false);
		g.setAdapter(new IconAdapter());
		g.setOnItemClickListener(this);

		rl.addView(g);
		setContentView(rl);
	}

	@Override
	public void onItemClick(AdapterView<?> av, View v, int pos, long id) {
		if (!iconPickerMode)
			return;

		if (resPickerMode) {
			ShortcutIconResource res = ((IconAdapter) av.getAdapter())
					.getResource(pos);

			if (res == null)
				setResult(RESULT_CANCELED, new Intent());
			else
				setResult(RESULT_OK, (new Intent()).putExtra(
						Intent.EXTRA_SHORTCUT_ICON_RESOURCE, res));
		} else {
			Bitmap bitmap = null;
			try {
				bitmap = (Bitmap) av.getAdapter().getItem(pos);
			} catch (Exception e) {
			}

			if (bitmap == null)
				setResult(RESULT_CANCELED, new Intent());
			else
				setResult(RESULT_OK, (new Intent()).putExtra("icon", bitmap));
		}

		finish();
	}
}
